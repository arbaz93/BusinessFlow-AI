-- Add conversation memory support to AI conversations.
-- Memory is a compact, server-managed summary of the conversation topic/intent.
-- It is NOT authoritative business data and is never a substitute for fresh BusinessFlow context.
ALTER TABLE "AIConversation" ADD COLUMN "memorySummary" TEXT;
ALTER TABLE "AIConversation" ADD COLUMN "memoryUpdatedAt" TIMESTAMP;
