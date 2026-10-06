# STEP 27 — Documents & Storage Production Hardening

## Storage Architecture

- **Bucket**: `project-documents` (Supabase Storage). The bucket is looked up on upload and created with `public: false` if missing. If the bucket exists but is public, uploads are refused with an explicit error. Verified live: `getBucket` reports `public: false`.
- **Privacy model**: no public URLs are used for protected documents. `storageUrl` remains `null` on every record and is never populated. Anonymous access to the bucket's public URL is denied (verified: non-200). Access flow is: authenticated user → workspace authorization (`requireOrganization` resolves the current workspace from the user's live memberships) → project authorization (`findFirst` scoped by `organizationId`) → document authorization (`findFirst` scoped by `organizationId` + `projectId`) → server-generated signed URL.
- **Storage path strategy**: server-generated `organizations/{organizationId}/projects/{projectId}/documents/{documentId}/{sanitized-file-name}`. Identity is the random `documentId` (UUID), never the user-supplied filename, so duplicate display names cannot overwrite each other (`upsert: false`). Paths contain no emails, usernames, or user-controlled directory names.
- **Signed URL strategy**: generated only after authorization, using the `storagePath` from the trusted database record (never a client-supplied path), with a 10-minute TTL (`PROJECT_DOCUMENT_SIGNED_URL_TTL_SECONDS = 600`), `download: originalName` for download mode. Signed URLs are not persisted anywhere. The service-role client is consolidated into `lib/supabase/admin.ts` (`server-only`) and is never imported by client code.
- **Path validation**: every storage path used for signing or deletion is re-validated against the expected namespace (`isProjectDocumentStoragePath`): exactly 7 segments, correct prefixes, no absolute paths, no backslashes, no control characters, no `.`/`..` segments, no leading-dot filenames, bounded length, and exact match against the authorized organization/project/document IDs.

## Upload Hardening

- **File validation** (`lib/project-documents/files.ts`, all server-side):
  - Supported types: PDF, DOCX, TXT, MD, CSV, PNG, JPG, GIF, WebP (covers the AI extraction formats PDF/DOCX/TXT/MD plus common asset/reference types). Arbitrary strings cannot become document types — the zod enum validates `documentType` against the Prisma enum values.
  - MIME/extension consistency: the browser-reported MIME must belong to the extension's accepted set (empty or `application/octet-stream` tolerated and normalized to the canonical MIME); a `brief.pdf` reporting `image/png` is rejected.
  - Content signature verification: the first ≤1024 bytes are read (bounded, never the whole file) and checked against magic bytes for PDF (`%PDF-`, tolerant of leading noise), DOCX (`PK`), PNG, JPEG, GIF, WebP. Text formats have no reliable signature and are accepted on metadata alone.
  - Filename handling: client path components are stripped (last segment only), control characters removed, unsafe characters folded to `_`, repeated underscores collapsed, leading dots (hidden files) and trailing separators removed, length bounded to 128 while preserving the extension, with a safe `document` fallback. `../../private.txt`, `<script>alert(1)</script>.pdf`, `..`, and 500-character names are all handled safely (unit tested).
  - Size limit: explicit server-side `MAX_PROJECT_DOCUMENT_FILE_BYTES = 20 MB`, matching the downstream AI extraction limit, documented in code and shown in the upload UI (`accept` attribute + hint text).
- **Failure cleanup**: storage upload happens first, then the database transaction. If the database save fails for any reason, the storage object is removed (`cleanupProjectDocumentStorageObject`) and the user is told the upload was cleaned up — no false `Document` record and no orphaned object (unless the cleanup itself fails, which is logged with the stage). Storage failures never create a database record.
- **Memory safety**: only the bounded 1024-byte head is read for signature checks; the `File` is streamed to Supabase without duplicate in-memory copies.

## Deletion Hardening

- Deletion resolves the authorized document first and deletes the storage object using the trusted `storagePath` from that record — a user can never target an arbitrary storage object.
- Ordering: storage removal → database transaction (record delete + `DOCUMENT_DELETED` activity). If storage deletion fails, the user receives a real error and the record remains. If the database step fails after storage removal, the user is told to retry; the retry treats an already-missing storage object (404/`NoSuchKey`/`NotFound`) as success and completes the database cleanup — deterministic and idempotent.
- Malformed storage paths on a record: storage removal is skipped (nothing trusted to delete), a warning is logged with the non-sensitive `documentId`, and the database record is still removed — self-healing without ever deleting an untrusted path.
- Account deletion (`lib/organizations/deletion.ts`): owned workspaces cascade-delete document rows, then their storage objects are removed in batches; batch cleanup now continues past failures and logs a summary instead of abandoning remaining batches.

## Primary Brief Integrity

- **Enforcement**: a partial unique index `ProjectDocument_one_primary_brief ON "ProjectDocument" ("organizationId", "projectId") WHERE "isPrimary" = true` (migration `20261006000000_project_document_primary_brief_guard`). The database now guarantees at most one primary brief per project, even under concurrent `setPrimaryProjectBrief` requests (two rapid set-A/set-B actions can no longer both commit). A losing concurrent transaction gets a `P2002` and a refresh-and-retry message.
- **Migration/data fix**: the migration first applies a deterministic correction — where a project somehow had multiple primaries, keep the most recently created one (the record the Documents UI shows first) and clear the rest — then creates the index. Existing dev data was inspected before applying: 2 briefs, each primary in different projects, zero violations, so the data fix was a no-op. The migration was applied to the dev database with `prisma migrate deploy` and verified live: a second primary for the same project is rejected with `P2002` inside a rolled-back transaction.
- **Deleting the primary brief**: does not promote another document (no auto-promotion logic exists anywhere). After deletion the project has no primary, and the AI state machine reports `NO_BRIEF`/`SOURCE_MISSING` accordingly.
- `setPrimaryProjectBrief` remains transactional (set target primary → unset all other briefs → activity insert), so the invariant holds and no duplicate `DOCUMENT_PRIMARY_SET` activities are created.

## Authorization

- **Same workspace**: authorized member → project → document → signed URL: allowed (verified end-to-end against the live Supabase project: signed URL returned HTTP 200 with the correct `%PDF-` content).
- **Cross workspace**: document lookup is scoped by `organizationId` resolved from the user's live memberships; a Workspace B user querying a Workspace A document ID gets "no longer available" (not-found convention). Removing a member's workspace membership removes their ability to resolve that workspace, so no new signed URLs can be issued; previously issued URLs simply expire after 10 minutes.
- **Wrong project**: the document query requires both `organizationId` and `projectId` to match; a valid document ID accessed through a different project ID is rejected.
- **Arbitrary client storage path**: ignored/rejected — signed URLs and deletions only ever use the database-resolved path, which is additionally namespace-validated.
- **Service-role audit**: `lib/supabase/admin.ts` is `server-only`; browser code uses `@supabase/ssr` with the publishable key for auth only. No client component can list, delete, download, or sign private storage objects.
- **Logging**: storage errors are logged with `statusCode`, `code`, and `errorName` only — never signed URLs, tokens, keys, raw error bodies, or document contents.

## AI Integration

- Primary brief resolution (`lib/project-ai/brief-content.ts`) is unchanged and remains authoritative: it resolves the current primary brief for the workspace/project at analysis time, requires `isPrimary`, checks the expected `documentId` against the analysis's source, validates the supported format, enforces the 20 MB / 20 s download bounds, and truncates at 200 000 chars.
- Stale-source protections are intact: `runAndPersistProjectAnalysis` re-checks `sourceDocumentId` and `sourceDocumentUpdatedAt` after the AI call and fails the attempt as `AI_ANALYSIS_STALE` if the primary brief changed; deleted sources surface as `SOURCE_MISSING`/`NO_BRIEF` with truthful UI messages. A missing storage object produces a `DOCUMENT_NOT_FOUND` failure — never a fabricated successful analysis.
- The stored MIME is now the normalized canonical type, which `isSupportedProjectBrief` already accepts, so PDF/DOCX/TXT/MD extraction behavior is preserved (verified against the real `Fernhill_Project_Brief.docx` and `RouteWise_Document_Brief.docx` fixtures: correct DOCX MIME, sizes, and storage paths).

## Activity

- Document events use the canonical Activity system inside the same transactions as the data changes: `DOCUMENT_CREATED` (upload), `DOCUMENT_PRIMARY_SET` (primary change), `DOCUMENT_DELETED` (deletion). Actor, organization, and project are always the authorized values. No signed URLs or storage paths are written to activity descriptions. No duplicate document activities are created (each mutation writes exactly one).

## Theme / Responsive QA

- No visual-language changes were made. The Documents tab keeps its existing design tokens; the only UI additions are the file-input `accept` attribute and a one-line upload hint (types + 20 MB limit), which stack responsively at 1440/1024/768/390/320 px. Long filenames are truncated via the existing `truncate` classes. Light and dark modes are unchanged, and the dark application gradient (`bg-gradient-to-br from-[var(--accent)]/10 to-[var(--muted)]/10`) remains at the application layer. Buttons keep text labels (no icon-only controls), and error/empty/loading states are truthful.

## Data Integrity

- Live dev audit (`npm run audit:storage`) against the real Supabase bucket and Postgres: 2 storage objects, 2 document records, **0 orphaned objects, 0 records without objects, 0 malformed paths** — fully consistent.
- Existing-data inspection found no multiple-primary violations, no missing storage paths, and correct MIME/size metadata. The two existing documents' storage paths exactly match the server-generated format and pass the new namespace validator.
- The raw `storagePath` is no longer sent to the browser (the documents page now sends `hasFile: boolean`), so storage implementation details are not exposed to the client.

## Automated Validation

All commands run in the repository root:

| Command | Result |
| --- | --- |
| `npm run typecheck` | Pass (0 errors) |
| `npm run lint` | Pass (0 errors, 12 pre-existing warnings — unchanged baseline) |
| `npm test` | Pass (201 tests, 0 failures — 172 existing + 29 new document tests) |
| `npx prisma validate` | Pass ("The schema at prisma/schema.prisma is valid") |
| `npm run build` | Pass ("Compiled successfully", all routes generated) |

Additional live verification: `npx prisma migrate deploy` applied the new migration; the partial unique index exists in Postgres and rejects a second primary brief (`P2002`); end-to-end storage checks confirmed bucket privacy, signed-URL access, and deletion.

New automated coverage (`tests/project-documents.files.test.ts`): filename sanitization (traversal, script tags, control chars, unicode, length bounds, empty/edge names), type/MIME/size validation, content signature verification, storage path building and namespace validation (cross-tenant, traversal, absolute, malformed), and input-schema enum validation.

## Deferred Issues

- **Live end-to-end UI walkthrough** (upload → set primary → AI re-run → delete) requires an authenticated browser session and was verified at the unit, storage, database-constraint, and storage-security layers instead of through the running UI.
- **Chunked/resumable uploads** for files near the 20 MB limit were intentionally not introduced (out of scope for this step).
- **Automatic orphan reconciliation** is not scheduled; the manual `npm run audit:storage` (with optional `--fix`) is the development/administrative strategy, matching the existing architecture (no job scheduler).
- **Prisma DSL**: partial unique indexes are not expressible in the Prisma schema, so the one-primary constraint lives in the migration SQL. `prisma migrate dev` drift detection may report the extra index in the future; the database remains the source of truth for the invariant.
- The AI extraction pipeline (`lib/project-ai/brief-content.ts`) keeps its own inline service-role client; it is server-only and correct, and was left untouched to avoid changing AI behavior in a hardening step.

## Final Status

STEP 27 COMPLETE
