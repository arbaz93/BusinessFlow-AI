CREATE TYPE "AIConversationMessageRole" AS ENUM ('USER', 'ASSISTANT');

CREATE TABLE "AIConversation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT 'New conversation',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIConversationMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" "AIConversationMessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "requestId" TEXT,
  "replyToMessageId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AIConversationMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AIConversationMessage_request_shape_check" CHECK (
    ("role" = 'USER' AND "requestId" IS NOT NULL AND "replyToMessageId" IS NULL)
    OR
    ("role" = 'ASSISTANT' AND "requestId" IS NULL AND "replyToMessageId" IS NOT NULL)
  )
);

CREATE INDEX "AIConversation_organizationId_createdById_updatedAt_idx"
  ON "AIConversation" ("organizationId", "createdById", "updatedAt");

CREATE UNIQUE INDEX "AIConversationMessage_conversationId_requestId_key"
  ON "AIConversationMessage" ("conversationId", "requestId");

CREATE UNIQUE INDEX "AIConversationMessage_replyToMessageId_key"
  ON "AIConversationMessage" ("replyToMessageId");

CREATE INDEX "AIConversationMessage_conversationId_createdAt_idx"
  ON "AIConversationMessage" ("conversationId", "createdAt");

ALTER TABLE "AIConversation"
  ADD CONSTRAINT "AIConversation_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

ALTER TABLE "AIConversation"
  ADD CONSTRAINT "AIConversation_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "AIConversationMessage"
  ADD CONSTRAINT "AIConversationMessage_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE;

ALTER TABLE "AIConversationMessage"
  ADD CONSTRAINT "AIConversationMessage_replyToMessageId_fkey"
  FOREIGN KEY ("replyToMessageId") REFERENCES "AIConversationMessage"("id") ON DELETE CASCADE;
