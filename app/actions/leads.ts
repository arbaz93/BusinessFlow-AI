"use server";

import { revalidatePath } from "next/cache";
import { requireOrganization } from "@/lib/auth/dal";
import { clientInputSchema } from "@/lib/clients/schemas";
import { prisma } from "@/lib/db/prisma";
import { leadEditableStatusSchema, leadIdSchema, leadInputSchema, type LeadFormState } from "@/lib/leads/schemas";

function readLeadFields(formData: FormData) {
  return leadInputSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    source: formData.get("source"),
    notes: formData.get("notes"),
    status: formData.get("status"),
    estimatedValue: formData.get("estimatedValue"),
    currency: formData.get("currency"),
  });
}

function revalidateLeadViews(leadId?: string) {
  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

export async function saveLead(_previousState: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const { profile, organization } = await requireOrganization();
  const parsed = readLeadFields(formData);

  if (!parsed.success) {
    return {
      error: "Review the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { estimatedValue, ...leadData } = parsed.data;
  const persistedLeadData = {
    ...leadData,
    estimatedValue: estimatedValue === undefined ? null : estimatedValue.toFixed(2),
  };

  const hasLeadId = formData.has("leadId");
  const rawLeadId = formData.get("leadId");
  const parsedLeadId = typeof rawLeadId === "string" ? leadIdSchema.safeParse(rawLeadId) : null;
  const leadId = parsedLeadId?.success ? parsedLeadId.data : undefined;
  const rawExpectedUpdatedAt = formData.get("expectedUpdatedAt");
  const expectedUpdatedAt = typeof rawExpectedUpdatedAt === "string" ? new Date(rawExpectedUpdatedAt) : null;
  if (hasLeadId && (!leadId || !expectedUpdatedAt || !Number.isFinite(expectedUpdatedAt.getTime()))) {
    return { error: "This lead changed while you were editing it. Refresh and try again." };
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      if (leadId) {
        const existing = await transaction.lead.findFirst({
          where: { id: leadId, organizationId: organization.id },
          select: {
            id: true,
            status: true,
            updatedAt: true,
            convertedAt: true,
            client: { select: { id: true } },
          },
        });
        if (!existing) return { kind: "unavailable" as const };
        if (existing.client || existing.convertedAt) return { kind: "converted" as const };
        if (existing.updatedAt.getTime() !== expectedUpdatedAt?.getTime()) return { kind: "changed" as const };

        const updated = await transaction.lead.updateMany({
          where: {
            id: existing.id,
            organizationId: organization.id,
            status: existing.status,
            updatedAt: expectedUpdatedAt,
            convertedAt: null,
            client: { is: null },
          },
          data: persistedLeadData,
        });
        if (updated.count !== 1) return { kind: "changed" as const };
        await transaction.activity.create({
          data: {
            organizationId: organization.id,
            actorId: profile.id,
            leadId: existing.id,
            type: existing.status === parsed.data.status ? "LEAD_UPDATED" : "LEAD_STATUS_CHANGED",
            description: existing.status === parsed.data.status
              ? "Lead details were updated."
              : `Lead status changed from ${existing.status} to ${parsed.data.status}.`,
          },
        });
        return { kind: "saved" as const, id: existing.id };
      }

      const lead = await transaction.lead.create({
        data: { ...persistedLeadData, organizationId: organization.id, createdById: profile.id },
        select: { id: true },
      });
      await transaction.activity.create({
        data: {
          organizationId: organization.id,
          actorId: profile.id,
          leadId: lead.id,
          type: "LEAD_CREATED",
          description: "Lead was added to the workspace.",
        },
      });
      return { kind: "saved" as const, id: lead.id };
    });

    if (result.kind === "unavailable") return { error: "This lead is unavailable in your workspace." };
    if (result.kind === "converted") return { error: "Converted leads are read-only to preserve sales history." };
    if (result.kind === "changed") return { error: "This lead changed while you were editing it. Refresh and try again." };
    revalidateLeadViews(result.id);
    return { success: true };
  } catch (error) {
    console.error("Lead save failed.", error);
    return { error: "We couldn't save this lead. Please try again." };
  }
}

export async function changeLeadStatus(leadId: string, value: string, expectedStatus: string) {
  const { profile, organization } = await requireOrganization();
  const parsedId = leadIdSchema.safeParse(leadId);
  const parsedStatus = leadEditableStatusSchema.safeParse(value);
  const parsedExpectedStatus = leadEditableStatusSchema.safeParse(expectedStatus);
  if (!parsedId.success || !parsedStatus.success || !parsedExpectedStatus.success) return { error: "Choose a valid lead and status." };

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const lead = await transaction.lead.findFirst({
        where: { id: parsedId.data, organizationId: organization.id },
        select: { id: true, status: true, convertedAt: true, client: { select: { id: true } } },
      });
      if (!lead) return "unavailable" as const;
      if (lead.client || lead.convertedAt) return "converted" as const;
      if (lead.status !== parsedExpectedStatus.data) return "changed" as const;
      if (lead.status === parsedStatus.data) return "unchanged" as const;

      const updated = await transaction.lead.updateMany({
        where: {
          id: lead.id,
          organizationId: organization.id,
          status: parsedExpectedStatus.data,
          convertedAt: null,
          client: { is: null },
        },
        data: { status: parsedStatus.data },
      });
      if (updated.count !== 1) return "changed" as const;
      await transaction.activity.create({
        data: {
          organizationId: organization.id,
          actorId: profile.id,
          leadId: lead.id,
          type: "LEAD_STATUS_CHANGED",
          description: `Lead status changed from ${lead.status} to ${parsedStatus.data}.`,
        },
      });
      return "updated" as const;
    });

    if (result === "unavailable") return { error: "This lead is unavailable in your workspace." };
    if (result === "converted") return { error: "Converted leads cannot be changed." };
    if (result === "changed") return { error: "This lead changed while you were updating it. Refresh and try again." };
    if (result === "unchanged") return { success: true };
    revalidateLeadViews(parsedId.data);
    return { success: true };
  } catch (error) {
    console.error("Lead status update failed.", error);
    return { error: "We couldn't update the lead status. Please try again." };
  }
}

class InvalidLeadClientDataError extends Error {}

export async function convertLead(leadId: string) {
  const { profile, organization } = await requireOrganization();
  const parsedId = leadIdSchema.safeParse(leadId);
  if (!parsedId.success) return { error: "This lead is unavailable in your workspace." };

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const lead = await transaction.lead.findFirst({
        where: { id: parsedId.data, organizationId: organization.id },
        include: { client: { select: { id: true } } },
      });
      if (!lead) return "unavailable" as const;
      if (lead.client || lead.convertedAt) return "already-converted" as const;
      if (lead.status !== "QUALIFIED" && lead.status !== "WON") return "not-qualified" as const;

      const claimed = await transaction.lead.updateMany({
        where: {
          id: lead.id,
          organizationId: organization.id,
          status: { in: ["QUALIFIED", "WON"] },
          convertedAt: null,
          client: { is: null },
        },
        data: { status: "WON", convertedAt: new Date() },
      });
      if (claimed.count !== 1) return "already-converted" as const;

      const currentLead = await transaction.lead.findFirst({
        where: { id: lead.id, organizationId: organization.id },
        select: { name: true, email: true, phone: true, company: true },
      });
      if (!currentLead) return "unavailable" as const;
      const clientData = clientInputSchema.safeParse({
        ...currentLead,
        status: "ACTIVE",
      });
      if (!clientData.success) throw new InvalidLeadClientDataError();

      const client = await transaction.client.create({
        data: {
          organizationId: organization.id,
          leadId: lead.id,
          name: clientData.data.name,
          email: clientData.data.email,
          phone: clientData.data.phone,
          company: clientData.data.company,
          status: clientData.data.status,
        },
        select: { id: true },
      });
      await transaction.activity.create({
        data: {
          organizationId: organization.id,
          actorId: profile.id,
          leadId: lead.id,
          clientId: client.id,
          type: "LEAD_CONVERTED",
          description: "Lead was converted into a client.",
        },
      });
      return "converted" as const;
    });

    if (result === "unavailable") return { error: "This lead is unavailable in your workspace." };
    if (result === "already-converted") return { error: "This lead has already been converted into a client." };
    if (result === "not-qualified") return { error: "Only a qualified or Won lead can be converted, and each lead can be converted once." };
    revalidateLeadViews(parsedId.data);
    return { success: true };
  } catch (error) {
    if (error instanceof InvalidLeadClientDataError) {
      return { error: "This lead needs a valid name and email before it can be converted. Edit the lead and try again." };
    }
    console.error("Lead conversion failed.", error);
    return { error: "We couldn't convert this lead. No changes were saved; please try again." };
  }
}

export async function deleteLead(leadId: string, expectedUpdatedAtValue: string) {
  const { profile, organization } = await requireOrganization();
  const parsedId = leadIdSchema.safeParse(leadId);
  const expectedUpdatedAt = typeof expectedUpdatedAtValue === "string" ? new Date(expectedUpdatedAtValue) : null;
  if (!parsedId.success || !expectedUpdatedAt || !Number.isFinite(expectedUpdatedAt.getTime())) {
    return { error: "This lead changed while you were deleting it. Refresh and try again." };
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const lead = await transaction.lead.findFirst({
        where: { id: parsedId.data, organizationId: organization.id },
        select: {
          id: true,
          name: true,
          company: true,
          convertedAt: true,
          updatedAt: true,
          client: { select: { id: true } },
        },
      });
      if (!lead) return "unavailable" as const;
      if (lead.client || lead.convertedAt) return "converted" as const;
      if (lead.updatedAt.getTime() !== expectedUpdatedAt.getTime()) return "conflict" as const;

      const deleted = await transaction.lead.deleteMany({
        where: {
          id: lead.id,
          organizationId: organization.id,
          updatedAt: expectedUpdatedAt,
          convertedAt: null,
          client: { is: null },
        },
      });

      if (deleted.count !== 1) {
        const current = await transaction.lead.findFirst({
          where: { id: lead.id, organizationId: organization.id },
          select: { updatedAt: true, convertedAt: true, client: { select: { id: true } } },
        });
        if (!current) return "unavailable" as const;
        if (current.client || current.convertedAt) return "converted" as const;
        return "conflict" as const;
      }

      await transaction.activity.create({
        data: {
          organizationId: organization.id,
          actorId: profile.id,
          type: "LEAD_DELETED",
          description: `Lead "${lead.name}"${lead.company ? ` at ${lead.company}` : ""} was deleted.`,
        },
      });
      return "deleted" as const;
    });

    if (result === "unavailable") return { error: "This lead is unavailable in your workspace." };
    if (result === "converted") return { error: "This lead is linked to a client and cannot be deleted." };
    if (result === "conflict") return { error: "This lead changed while you were deleting it. Refresh and try again." };

    revalidateLeadViews(parsedId.data);
    return { success: true };
  } catch (error) {
    console.error("Lead deletion failed.", error);
    return { error: "We couldn't delete this lead. No changes were saved; please try again." };
  }
}