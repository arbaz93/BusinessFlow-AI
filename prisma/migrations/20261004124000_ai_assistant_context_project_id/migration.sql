-- Add an optional, server-controlled project context hint to assistant conversations.
-- This stores only an opaque identifier that is re-authorized on every request.
-- It is intentionally not a foreign key: the assistant must never trust a stored
-- project id and must re-verify organization/project access at request time.
ALTER TABLE "AIConversation" ADD COLUMN "contextProjectId" TEXT;

COMMENT ON COLUMN "AIConversation"."contextProjectId" IS 'Opaque, re-authorized hint used to scope assistant context. Never trusted directly.';
