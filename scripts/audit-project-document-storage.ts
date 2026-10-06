import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const { getSupabaseAdminClient } = await import("@/lib/supabase/admin");
const { prisma } = await import("@/lib/db/prisma");
const { isProjectDocumentStoragePath } = await import("@/lib/project-documents/files");

const PROJECT_DOCUMENT_BUCKET = "project-documents";
const LIST_PAGE_SIZE = 1000;

type StorageEntry = {
  name: string;
  metadata: unknown;
};

async function listStoragePaths(
  storage: ReturnType<typeof getSupabaseAdminClient>["storage"],
  prefix: string,
  collected: string[],
): Promise<void> {
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await storage
      .from(PROJECT_DOCUMENT_BUCKET)
      .list(prefix, { limit: LIST_PAGE_SIZE, offset });

    if (error) {
      throw new Error(
        `Could not list storage objects under "${prefix || "(root)"}": ${error.message}`,
      );
    }

    const entries = (data ?? []) as StorageEntry[];
    for (const entry of entries) {
      const childPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.metadata) {
        collected.push(childPath);
      } else {
        await listStoragePaths(storage, childPath, collected);
      }
    }

    offset += entries.length;
    hasMore = entries.length === LIST_PAGE_SIZE;
  }
}

async function main() {
  const fixOrphans = process.argv.includes("--fix");
  const supabase = getSupabaseAdminClient();

  console.log("Auditing project document storage consistency…");

  const [storagePaths, documents] = await Promise.all([
    (async () => {
      const collected: string[] = [];
      await listStoragePaths(supabase.storage, "", collected);
      return collected;
    })(),
    prisma.projectDocument.findMany({
      where: { storagePath: { not: null } },
      select: { id: true, organizationId: true, projectId: true, storagePath: true },
    }),
  ]);

  const storagePathSet = new Set(storagePaths);
  const documentPathSet = new Set(documents.map((document) => document.storagePath as string));

  const orphanedObjects = storagePaths.filter((path) => !documentPathSet.has(path));
  const recordsWithoutObjects = documents.filter(
    (document) => !storagePathSet.has(document.storagePath as string),
  );
  const malformedPaths = documents.filter(
    (document) =>
      !isProjectDocumentStoragePath(document.storagePath, {
        organizationId: document.organizationId,
        projectId: document.projectId,
        documentId: document.id,
      }),
  );

  console.log(`Storage objects in bucket: ${storagePaths.length}`);
  console.log(`Document records with storagePath: ${documents.length}`);
  console.log(`Orphaned storage objects (no document record): ${orphanedObjects.length}`);
  console.log(`Document records without a storage object: ${recordsWithoutObjects.length}`);
  console.log(`Document records with malformed storage paths: ${malformedPaths.length}`);

  if (orphanedObjects.length > 0) {
    console.log("Orphaned objects:");
    for (const path of orphanedObjects.slice(0, 20)) console.log(`  ${path}`);
    if (orphanedObjects.length > 20) {
      console.log(`  …and ${orphanedObjects.length - 20} more`);
    }
  }

  if (recordsWithoutObjects.length > 0) {
    console.log("Document records without storage objects:");
    for (const document of recordsWithoutObjects.slice(0, 20)) {
      console.log(`  documentId=${document.id} path=${document.storagePath}`);
    }
    if (recordsWithoutObjects.length > 20) {
      console.log(`  …and ${recordsWithoutObjects.length - 20} more`);
    }
  }

  if (malformedPaths.length > 0) {
    console.log("Document records with malformed storage paths:");
    for (const document of malformedPaths.slice(0, 20)) {
      console.log(`  documentId=${document.id} path=${document.storagePath}`);
    }
    if (malformedPaths.length > 20) {
      console.log(`  …and ${malformedPaths.length - 20} more`);
    }
  }

  if (fixOrphans && orphanedObjects.length > 0) {
    for (let index = 0; index < orphanedObjects.length; index += LIST_PAGE_SIZE) {
      const batch = orphanedObjects.slice(index, index + LIST_PAGE_SIZE);
      const { error } = await supabase.storage.from(PROJECT_DOCUMENT_BUCKET).remove(batch);
      if (error) {
        console.error(`Could not remove orphan batch ${index / LIST_PAGE_SIZE}:`, error.message);
        process.exitCode = 1;
      } else {
        console.log(`Removed ${batch.length} orphaned storage objects.`);
      }
    }
  } else if (orphanedObjects.length > 0) {
    console.log("Re-run with --fix to remove orphaned storage objects.");
  }

  if (orphanedObjects.length > 0 || recordsWithoutObjects.length > 0 || malformedPaths.length > 0) {
    process.exitCode = process.exitCode ?? 1;
  } else {
    console.log("Storage and database are consistent.");
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("Storage audit failed.", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : String(error),
  });
  await prisma.$disconnect().catch(() => undefined);
  process.exitCode = 1;
});
