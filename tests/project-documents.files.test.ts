import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MAX_PROJECT_DOCUMENT_FILE_BYTES,
  PROJECT_DOCUMENT_ACCEPT_ATTRIBUTE,
  buildProjectDocumentStoragePath,
  formatProjectDocumentFileSize,
  getProjectDocumentFileExtension,
  isProjectDocumentStoragePath,
  readProjectDocumentFileHead,
  sanitizeProjectDocumentFileName,
  validateProjectDocumentUploadFile,
  verifyProjectDocumentFileContent,
} from "@/lib/project-documents/files";
import { projectDocumentInputSchema } from "@/lib/project-documents/schemas";

const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_MAGIC = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const GIF_MAGIC = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
const WEBP_MAGIC = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
const DOCX_MAGIC = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
const PLAIN_TEXT = new TextEncoder().encode("Project brief content");

describe("Project document filename sanitization", () => {
  it("keeps ordinary filenames intact", () => {
    assert.equal(sanitizeProjectDocumentFileName("Project-Brief.pdf"), "Project-Brief.pdf");
    assert.equal(sanitizeProjectDocumentFileName("Project_Brief.pdf"), "Project_Brief.pdf");
    assert.equal(sanitizeProjectDocumentFileName("BrandGuidelines.v2.docx"), "BrandGuidelines.v2.docx");
  });

  it("folds whitespace and unsafe separators into underscores", () => {
    assert.equal(sanitizeProjectDocumentFileName("Project Brief.pdf"), "Project_Brief.pdf");
    assert.equal(sanitizeProjectDocumentFileName("Brand  Guidelines.docx"), "Brand_Guidelines.docx");
  });

  it("strips client-supplied path components", () => {
    assert.equal(sanitizeProjectDocumentFileName("../../private.txt"), "private.txt");
    assert.equal(sanitizeProjectDocumentFileName("..\\..\\file.pdf"), "file.pdf");
    assert.equal(sanitizeProjectDocumentFileName("some/nested/dir/Requirements.txt"), "Requirements.txt");
  });

  it("neutralizes script tags and unsafe symbols without separators", () => {
    const sanitized = sanitizeProjectDocumentFileName("<script>alert(1)</script>.pdf");
    assert.ok(!sanitized.includes("<"));
    assert.ok(!sanitized.includes(">"));
    assert.ok(!sanitized.includes("/"));
    assert.ok(sanitized.endsWith(".pdf"));
  });

  it("rejects traversal-only names and empty input with a safe fallback", () => {
    assert.equal(sanitizeProjectDocumentFileName(".."), "document");
    assert.equal(sanitizeProjectDocumentFileName("."), "document");
    assert.equal(sanitizeProjectDocumentFileName(""), "document");
    assert.equal(sanitizeProjectDocumentFileName("   "), "document");
    assert.equal(sanitizeProjectDocumentFileName("###"), "document");
    assert.equal(sanitizeProjectDocumentFileName("._"), "document");
  });

  it("removes hidden-file leading dots and trailing separators", () => {
    assert.equal(sanitizeProjectDocumentFileName(".bashrc"), "bashrc");
    assert.equal(sanitizeProjectDocumentFileName("file."), "file");
    assert.equal(sanitizeProjectDocumentFileName("file_"), "file");
  });

  it("removes control characters", () => {
    assert.equal(sanitizeProjectDocumentFileName("bri\u0000ef\u001f.txt"), "brief.txt");
    assert.ok(!sanitizeProjectDocumentFileName("a\u007f\u0090b.md").match(/[\u0000-\u001f\u007f-\u009f]/u));
  });

  it("preserves legitimate unicode filenames", () => {
    const sanitized = sanitizeProjectDocumentFileName("Briéf für Kunden.pdf");
    assert.ok(sanitized.includes("Briéf"));
    assert.ok(sanitized.includes("für"));
    assert.ok(sanitized.endsWith(".pdf"));
    assert.ok(!sanitized.includes(" "));
  });

  it("bounds storage filename length", () => {
    const longName = `${"a".repeat(500)}.pdf`;
    const sanitized = sanitizeProjectDocumentFileName(longName);
    assert.ok(sanitized.length <= 128);
    assert.ok(sanitized.endsWith(".pdf"));
  });
});

describe("Project document file type validation", () => {
  it("accepts supported documents with matching metadata", () => {
    const pdf = validateProjectDocumentUploadFile({
      name: "Project Brief.pdf",
      size: 1024,
      type: "application/pdf",
    });
    assert.equal(pdf.ok, true);
    if (pdf.ok) {
      assert.equal(pdf.extension, "pdf");
      assert.equal(pdf.mimeType, "application/pdf");
      assert.equal(pdf.storageName, "Project_Brief.pdf");
      assert.equal(pdf.originalName, "Project Brief.pdf");
    }

    const docx = validateProjectDocumentUploadFile({
      name: "Brief.docx",
      size: 10,
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    assert.equal(docx.ok, true);

    const txt = validateProjectDocumentUploadFile({ name: "notes.txt", size: 10, type: "text/plain" });
    assert.equal(txt.ok, true);

    const md = validateProjectDocumentUploadFile({ name: "notes.md", size: 10, type: "text/markdown" });
    assert.equal(md.ok, true);
  });

  it("tolerates missing or generic browser MIME types and normalizes them", () => {
    const missing = validateProjectDocumentUploadFile({ name: "brief.pdf", size: 10, type: "" });
    assert.equal(missing.ok, true);
    if (missing.ok) assert.equal(missing.mimeType, "application/pdf");

    const octet = validateProjectDocumentUploadFile({ name: "brief.docx", size: 10, type: "application/octet-stream" });
    assert.equal(octet.ok, true);
    if (octet.ok) assert.equal(octet.mimeType, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    const parameters = validateProjectDocumentUploadFile({ name: "brief.txt", size: 10, type: "text/plain; charset=utf-8" });
    assert.equal(parameters.ok, true);
  });

  it("rejects MIME types that do not match the file extension", () => {
    const fakePdf = validateProjectDocumentUploadFile({
      name: "brief.pdf",
      size: 10,
      type: "image/png",
    });
    assert.equal(fakePdf.ok, false);

    const fakeDocx = validateProjectDocumentUploadFile({
      name: "brief.docx",
      size: 10,
      type: "application/zip",
    });
    assert.equal(fakeDocx.ok, false);
  });

  it("rejects unsupported and dangerous file types", () => {
    for (const name of ["payload.exe", "page.html", "script.js", "image.svg", "app.php", "file.bin"]) {
      const result = validateProjectDocumentUploadFile({ name, size: 10, type: "application/octet-stream" });
      assert.equal(result.ok, false, `${name} should be rejected`);
    }
  });

  it("rejects empty, oversized, and nameless files", () => {
    assert.equal(validateProjectDocumentUploadFile({ name: "", size: 10, type: "application/pdf" }).ok, false);
    assert.equal(validateProjectDocumentUploadFile({ name: "brief.pdf", size: 0, type: "application/pdf" }).ok, false);
    assert.equal(
      validateProjectDocumentUploadFile({ name: "brief.pdf", size: Number.POSITIVE_INFINITY, type: "application/pdf" }).ok,
      false,
    );

    const oversized = validateProjectDocumentUploadFile({
      name: "brief.pdf",
      size: MAX_PROJECT_DOCUMENT_FILE_BYTES + 1,
      type: "application/pdf",
    });
    assert.equal(oversized.ok, false);

    const atLimit = validateProjectDocumentUploadFile({
      name: "brief.pdf",
      size: MAX_PROJECT_DOCUMENT_FILE_BYTES,
      type: "application/pdf",
    });
    assert.equal(atLimit.ok, true);
  });

  it("exposes the upload limit and accepted types for the UI", () => {
    assert.equal(formatProjectDocumentFileSize(MAX_PROJECT_DOCUMENT_FILE_BYTES), "20 MB");
    assert.ok(PROJECT_DOCUMENT_ACCEPT_ATTRIBUTE.includes(".pdf"));
    assert.ok(PROJECT_DOCUMENT_ACCEPT_ATTRIBUTE.includes("application/pdf"));
    assert.ok(PROJECT_DOCUMENT_ACCEPT_ATTRIBUTE.includes(".docx"));
    assert.ok(!PROJECT_DOCUMENT_ACCEPT_ATTRIBUTE.includes(".exe"));
  });

  it("derives extensions safely", () => {
    assert.equal(getProjectDocumentFileExtension("brief.pdf"), "pdf");
    assert.equal(getProjectDocumentFileExtension("brief.PDF"), "pdf");
    assert.equal(getProjectDocumentFileExtension("brief"), "");
    assert.equal(getProjectDocumentFileExtension("brief."), "");
    assert.equal(getProjectDocumentFileExtension("archive.tar.gz"), "gz");
  });
});

describe("Project document content signature verification", () => {
  it("accepts content whose signature matches the extension", () => {
    assert.equal(verifyProjectDocumentFileContent(PDF_MAGIC, "pdf"), true);
    assert.equal(verifyProjectDocumentFileContent(DOCX_MAGIC, "docx"), true);
    assert.equal(verifyProjectDocumentFileContent(PNG_MAGIC, "png"), true);
    assert.equal(verifyProjectDocumentFileContent(JPEG_MAGIC, "jpg"), true);
    assert.equal(verifyProjectDocumentFileContent(GIF_MAGIC, "gif"), true);
    assert.equal(verifyProjectDocumentFileContent(WEBP_MAGIC, "webp"), true);
  });

  it("rejects content whose signature contradicts the extension", () => {
    assert.equal(verifyProjectDocumentFileContent(PNG_MAGIC, "pdf"), false);
    assert.equal(verifyProjectDocumentFileContent(new TextEncoder().encode("not a pdf"), "pdf"), false);
    assert.equal(verifyProjectDocumentFileContent(PDF_MAGIC, "docx"), false);
    assert.equal(verifyProjectDocumentFileContent(new TextEncoder().encode("PK"), "docx"), false);
  });

  it("tolerates leading noise before a PDF header and skips text formats", () => {
    const noisyPdf = new Uint8Array([...PLAIN_TEXT.slice(0, 32), ...PDF_MAGIC]);
    assert.equal(verifyProjectDocumentFileContent(noisyPdf, "pdf"), true);
    assert.equal(verifyProjectDocumentFileContent(PLAIN_TEXT, "txt"), true);
    assert.equal(verifyProjectDocumentFileContent(PLAIN_TEXT, "md"), true);
    assert.equal(verifyProjectDocumentFileContent(PLAIN_TEXT, "csv"), true);
  });

  it("treats unreadable or empty heads as verifiable", () => {
    assert.equal(verifyProjectDocumentFileContent(null, "pdf"), true);
    assert.equal(verifyProjectDocumentFileContent(new Uint8Array(0), "pdf"), true);
  });

  it("reads only a bounded head of the uploaded file", async () => {
    const blob = new Blob([new Uint8Array(4096).fill(0x25)]);
    const head = await readProjectDocumentFileHead(blob);
    assert.ok(head.length <= 1024);
  });
});

describe("Project document storage path strategy", () => {
  const scope = {
    organizationId: "org_1",
    projectId: "proj_1",
    documentId: "doc_1",
  };

  it("builds tenant-isolated storage paths from stable identifiers", () => {
    const path = buildProjectDocumentStoragePath(scope, "Project_Brief.pdf");
    assert.equal(path, "organizations/org_1/projects/proj_1/documents/doc_1/Project_Brief.pdf");
  });

  it("accepts paths generated for the matching scope", () => {
    const path = buildProjectDocumentStoragePath(scope, "file.pdf");
    assert.equal(isProjectDocumentStoragePath(path, scope), true);
    assert.equal(isProjectDocumentStoragePath(path), true);
  });

  it("rejects paths belonging to another tenant, project, or document", () => {
    const path = buildProjectDocumentStoragePath(scope, "file.pdf");
    assert.equal(isProjectDocumentStoragePath(path, { ...scope, organizationId: "org_2" }), false);
    assert.equal(isProjectDocumentStoragePath(path, { ...scope, projectId: "proj_2" }), false);
    assert.equal(isProjectDocumentStoragePath(path, { ...scope, documentId: "doc_2" }), false);
  });

  it("rejects traversal, absolute, escaped, and malformed paths", () => {
    assert.equal(isProjectDocumentStoragePath("/organizations/org_1/projects/proj_1/documents/doc_1/f.pdf"), false);
    assert.equal(isProjectDocumentStoragePath("organizations\\org_1/projects/proj_1/documents/doc_1/f.pdf"), false);
    assert.equal(isProjectDocumentStoragePath("organizations/../administrator/file.txt"), false);
    assert.equal(isProjectDocumentStoragePath("organizations/org_1/projects/proj_1/documents/doc_1/../../secret.pdf"), false);
    assert.equal(isProjectDocumentStoragePath("organizations/org_1/projects/proj_1/documents/doc_1"), false);
    assert.equal(isProjectDocumentStoragePath("organizations/org_1/projects/proj_1/documents/doc_1/a/b.pdf"), false);
    assert.equal(isProjectDocumentStoragePath("organizations/org_1/projects/proj_1/documents/doc_1/.hidden.pdf"), false);
    assert.equal(isProjectDocumentStoragePath("organizations/org_1/projects/proj_1/documents/doc_1/.."), false);
    assert.equal(isProjectDocumentStoragePath("organizations/org_1/projects/proj_1/documents/doc_1/\u0000evil.pdf"), false);
    assert.equal(isProjectDocumentStoragePath(""), false);
    assert.equal(isProjectDocumentStoragePath(null), false);
    assert.equal(isProjectDocumentStoragePath(undefined), false);
  });

  it("rejects client-submitted storage paths as a namespace escape", () => {
    const malicious = "organizations/victim-org/projects/victim-project/documents/victim-document/stolen.pdf";
    assert.equal(isProjectDocumentStoragePath(malicious, scope), false);
  });
});

describe("Project document input schema", () => {
  it("accepts valid document input", () => {
    const parsed = projectDocumentInputSchema.safeParse({
      projectId: "proj_1",
      name: "Project Brief",
      documentType: "PROJECT_BRIEF",
      isPrimary: "true",
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.documentType, "PROJECT_BRIEF");
      assert.equal(parsed.data.isPrimary, true);
    }
  });

  it("rejects arbitrary document types from the browser", () => {
    const parsed = projectDocumentInputSchema.safeParse({
      projectId: "proj_1",
      name: "Project Brief",
      documentType: "SUPER_ADMIN_FILE",
      isPrimary: false,
    });
    assert.equal(parsed.success, false);
  });

  it("rejects oversized or missing names and project IDs", () => {
    assert.equal(
      projectDocumentInputSchema.safeParse({ projectId: "proj_1", name: "", documentType: "OTHER" }).success,
      false,
    );
    assert.equal(
      projectDocumentInputSchema.safeParse({
        projectId: "proj_1",
        name: "n".repeat(161),
        documentType: "OTHER",
      }).success,
      false,
    );
    assert.equal(
      projectDocumentInputSchema.safeParse({ projectId: "", name: "Brief", documentType: "OTHER" }).success,
      false,
    );
  });
});
