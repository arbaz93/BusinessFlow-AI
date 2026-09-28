"use server";

import { revalidatePath } from "next/cache";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { clientIdSchema, clientInputSchema, clientStatusSchema, type ClientFormState } from "@/lib/clients/schemas";

function parseClientForm(formData: FormData) {
  return clientInputSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
}

export async function saveClient(_previousState: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const { organization, profile } = await requireOrganization();
  const parsed = parseClientForm(formData);

  if (!parsed.success) {
    return { error: "Review the highlighted fields and try again.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const clientData = {
    ...parsed.data,
    company: parsed.data.company ?? null,
    phone: parsed.data.phone ?? null,
    notes: parsed.data.notes ?? null,
  };

  const rawClientId = formData.get("clientId");
  const clientId = typeof rawClientId === "string" && rawClientId.trim() ? rawClientId.trim() : undefined;
  const rawExpectedUpdatedAt = formData.get("expectedUpdatedAt");
  const expectedUpdatedAt = typeof rawExpectedUpdatedAt === "string" ? new Date(rawExpectedUpdatedAt) : null;
  if (clientId && (!expectedUpdatedAt || !Number.isFinite(expectedUpdatedAt.getTime()))) {
    return { error: "This client changed while you were editing it. Refresh and try again." };
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      if (clientId) {
        const validId = clientIdSchema.safeParse(clientId);
        if (!validId.success) return { kind: "unavailable" as const };
        const current = await transaction.client.findFirst({
          where: { id: validId.data, organizationId: organization.id },
          select: { id: true, status: true, updatedAt: true },
        });
        if (!current) return { kind: "unavailable" as const };
        if (current.updatedAt.getTime() !== expectedUpdatedAt?.getTime()) return { kind: "changed" as const };

        const updated = await transaction.client.updateMany({
          where: { id: current.id, organizationId: organization.id, updatedAt: expectedUpdatedAt },
          data: clientData,
        });
        if (updated.count !== 1) return { kind: "changed" as const };
        await transaction.activity.create({
          data: {
            organizationId: organization.id,
            actorId: profile.id,
            clientId: current.id,
            type: current.status === clientData.status ? "CLIENT_UPDATED" : "CLIENT_STATUS_CHANGED",
            description: current.status === clientData.status ? "Client information was updated." : `Client status changed to ${clientData.status}.`,
          },
        });
        return { kind: "saved" as const, id: current.id };
      }

      const client = await transaction.client.create({
        data: { ...clientData, organizationId: organization.id },
        select: { id: true },
      });
      await transaction.activity.create({
        data: {
          organizationId: organization.id,
          actorId: profile.id,
          clientId: client.id,
          type: "CLIENT_CREATED",
          description: "Client was created.",
        },
      });
      return { kind: "saved" as const, id: client.id };
    });

    if (result.kind === "unavailable") return { error: "This client is unavailable in your workspace." };
    if (result.kind === "changed") return { error: "This client changed while you were editing it. Refresh and try again." };
    revalidatePath("/clients");
    revalidatePath(`/clients/${result.id}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Client save failed.", error);
    return { error: "We couldn't save this client. Please try again." };
  }
}

export async function changeClientStatus(clientId: string, value: string, expectedStatus: string) {
  const { organization, profile } = await requireOrganization();
  const parsedId = clientIdSchema.safeParse(clientId);
  const parsedStatus = clientStatusSchema.safeParse(value);
  const parsedExpectedStatus = clientStatusSchema.safeParse(expectedStatus);
  if (!parsedId.success || !parsedStatus.success || !parsedExpectedStatus.success) return { error: "Choose a valid client and status." };

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const client = await transaction.client.findFirst({
        where: { id: parsedId.data, organizationId: organization.id },
        select: { id: true, status: true },
      });
      if (!client) return "unavailable" as const;
      if (client.status !== parsedExpectedStatus.data) return "changed" as const;
      if (client.status === parsedStatus.data) return "unchanged" as const;

      const updated = await transaction.client.updateMany({
        where: { id: client.id, organizationId: organization.id, status: parsedExpectedStatus.data },
        data: { status: parsedStatus.data },
      });
      if (updated.count !== 1) return "changed" as const;
      await transaction.activity.create({
        data: {
          organizationId: organization.id,
          actorId: profile.id,
          clientId: client.id,
          type: "CLIENT_STATUS_CHANGED",
          description: `Client status changed to ${parsedStatus.data}.`,
        },
      });
      return "updated" as const;
    });

    if (result === "unavailable") return { error: "This client is unavailable in your workspace." };
    if (result === "changed") return { error: "This client changed while you were updating it. Refresh and try again." };
    if (result === "unchanged") return { success: true };
    revalidatePath("/clients");
    revalidatePath(`/clients/${parsedId.data}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Client status update failed.", error);
    return { error: "We couldn't update this client. Please try again." };
  }
}

class ClientDeleteConflictError extends Error {}

export async function deleteClient(clientId: string) {
  const { organization } = await requireOrganization();
  const parsedId = clientIdSchema.safeParse(clientId);
  if (!parsedId.success) return { error: "This client is unavailable in your workspace." };

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const client = await transaction.client.findFirst({
        where: { id: parsedId.data, organizationId: organization.id },
        select: {
          id: true,
          leadId: true,
          _count: { select: { activities: { where: { organizationId: organization.id } } } },
        },
      });
      if (!client) return { kind: "unavailable" as const };
      if (client._count.activities > 0) {
        return { kind: "dependent" as const, dependencyCount: client._count.activities };
      }

      const detached = await transaction.client.updateMany({
        where: {
          id: client.id,
          organizationId: organization.id,
          activities: { none: { organizationId: organization.id } },
        },
        data: { leadId: null },
      });
      if (detached.count !== 1) return { kind: "changed" as const };

      const deleted = await transaction.client.deleteMany({
        where: {
          id: client.id,
          organizationId: organization.id,
          leadId: null,
          activities: { none: { organizationId: organization.id } },
        },
      });
      if (deleted.count !== 1) throw new ClientDeleteConflictError();

      return { kind: "deleted" as const, leadId: client.leadId };
    });

    if (result.kind === "unavailable") return { error: "This client is unavailable in your workspace." };
    if (result.kind === "dependent") {
      return {
        error: `This client has ${result.dependencyCount} associated ${result.dependencyCount === 1 ? "activity record" : "activity records"} and cannot be permanently deleted. Deactivate the client instead to preserve its history.`,
        dependencyCount: result.dependencyCount,
      };
    }
    if (result.kind === "changed") {
      return { error: "This client changed while you were deleting it. Refresh and try again." };
    }

    revalidatePath("/clients");
    revalidatePath(`/clients/${parsedId.data}`);
    revalidatePath("/dashboard");
    revalidatePath("/leads");
    if (result.leadId) revalidatePath(`/leads/${result.leadId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof ClientDeleteConflictError) {
      return { error: "This client changed while you were deleting it. Refresh and try again." };
    }
    console.error("Client deletion failed.", error);
    return { error: "We couldn't delete this client. No changes were saved; please try again." };
  }
}