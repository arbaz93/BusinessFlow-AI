import "server-only";

import { prisma } from "@/lib/db/prisma";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { evaluateDeletionEligibility, type DeletionEligibility, type WorkspaceOwnership } from "@/lib/organizations/deletion-eligibility";

const PROJECT_DOCUMENT_BUCKET = "project-documents";
const STORAGE_BATCH_SIZE = 100;

export type AccountDeletionEligibility = DeletionEligibility;

export type DeleteAccountResult =
  | { success: true }
  | { success: false; error: string; blocked: boolean };

export async function getWorkspaceOwnership(userId: string): Promise<WorkspaceOwnership[]> {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: { organization: { select: { name: true } } },
  });

  if (memberships.length === 0) return [];

  const memberCounts = await prisma.organizationMember.groupBy({
    by: ["organizationId"],
    where: { organizationId: { in: memberships.map((m) => m.organizationId) } },
    _count: { _all: true },
  });

  const countByOrganization = new Map(
    memberCounts.map((row) => [row.organizationId, row._count._all]),
  );

  return memberships.map((membership) => ({
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    role: membership.role,
    memberCount: countByOrganization.get(membership.organizationId) ?? 0,
  }));
}

export async function getAccountDeletionEligibility(
  userId: string,
): Promise<AccountDeletionEligibility> {
  const ownership = await getWorkspaceOwnership(userId);
  return evaluateDeletionEligibility(ownership);
}

export async function deleteAccount(params: {
  profileId: string;
  authUserId: string;
}): Promise<DeleteAccountResult> {
  const { profileId, authUserId } = params;

  try {
    const ownership = await getWorkspaceOwnership(profileId);
    const eligibility = evaluateDeletionEligibility(ownership);

    if (!eligibility.eligible) {
      return { success: false, error: eligibility.reason, blocked: true };
    }

    const ownedOrgIds = eligibility.ownedWorkspaceIds;

    const documents = await prisma.projectDocument.findMany({
      where: {
        organizationId: { in: ownedOrgIds },
        storagePath: { not: null },
      },
      select: { storagePath: true },
    });
    const storagePaths = documents.map((doc) => doc.storagePath as string);

    await prisma.$transaction(async (transaction) => {
      if (ownedOrgIds.length > 0) {
        await transaction.organization.deleteMany({
          where: { id: { in: ownedOrgIds } },
        });
      }

      // The Supabase user is referenced by AISuggestedTaskApproval.approvedById
      // and AIAnalysisFeedback.createdById with ON DELETE RESTRICT. Owned
      // workspaces were already cascade-removed above; clear any residual
      // user attributions in shared workspaces so the application user can be
      // removed without violating the foreign keys.
      await transaction.aISuggestedTaskApproval.deleteMany({
        where: { approvedById: profileId },
      });
      await transaction.aIAnalysisFeedback.deleteMany({
        where: { createdById: profileId },
      });

      await transaction.user.delete({ where: { id: profileId } });
    });

    await deleteWorkspaceStorage(ownedOrgIds, storagePaths);

    const supabase = getSupabaseAdminClient();
    const { error: authError } = await supabase.auth.admin.deleteUser(authUserId);
    if (authError) {
      console.error("Account deletion: Supabase Auth user could not be removed.", {
        userId: profileId,
        authUserId,
        errorName: authError instanceof Error ? authError.name : "UnknownError",
      });
      return {
        success: false,
        error:
          "We couldn't complete account deletion. Your account data was removed, but your authentication identity could not be deleted. Please try again or contact support.",
        blocked: false,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Account deletion failed unexpectedly.", {
      userId: profileId,
      authUserId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      success: false,
      error:
        "We couldn't complete account deletion. Your account has not been confirmed as deleted. Please try again.",
      blocked: false,
    };
  }
}

async function deleteWorkspaceStorage(_orgIds: string[], storagePaths: string[]) {
  if (storagePaths.length === 0) return;

  const supabase = getSupabaseAdminClient();
  const failedBatches: string[] = [];
  for (let index = 0; index < storagePaths.length; index += STORAGE_BATCH_SIZE) {
    const batch = storagePaths.slice(index, index + STORAGE_BATCH_SIZE);
    const { error } = await supabase.storage
      .from(PROJECT_DOCUMENT_BUCKET)
      .remove(batch);
    if (error) {
      console.error("Account deletion: storage object cleanup failed for a batch.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
        batchIndex: index / STORAGE_BATCH_SIZE,
        batchSize: batch.length,
      });
      failedBatches.push(`${index}-${index + batch.length}`);
    }
  }
  if (failedBatches.length > 0) {
    console.error("Account deletion: some storage object batches could not be removed.", {
      failedBatchCount: failedBatches.length,
      totalBatches: Math.ceil(storagePaths.length / STORAGE_BATCH_SIZE),
    });
  }
}
