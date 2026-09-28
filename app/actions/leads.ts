"use server";

import { revalidatePath } from "next/cache";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { leadInputSchema, leadStatusSchema, type LeadFormState } from "@/lib/leads/schemas";

function readLeadFields(formData: FormData) {
  return leadInputSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    source: formData.get("source"),
    notes: formData.get("notes"),
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

  const rawLeadId = formData.get("leadId");
  const leadId = typeof rawLeadId === "string" && rawLeadId.trim() ? rawLeadId.trim() : undefined;

  try {
    const savedId = await prisma.$transaction(async (transaction) => {
      if (leadId) {
        const existing = await transaction.lead.findFirst({
          where: { id: leadId, organizationId: organization.id },
          select: { id: true },
        });
        if (!existing) return null;

        await transaction.lead.update({ where: { id: existing.id }, data: parsed.data });
        await transaction.activity.create({
          data: {
            organizationId: organization.id,
            actorId: profile.id,
            leadId: existing.id,
            type: "LEAD_UPDATED",
            description: "Lead details were updated.",
          },
        });
        return existing.id;
      }

      const lead = await transaction.lead.create({
        data: { ...parsed.data, organizationId: organization.id },
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
      return lead.id;
    });

    if (!savedId) return { error: "This lead is unavailable in your workspace." };
    revalidateLeadViews(savedId);
    return { success: true };
  } catch {
    return { error: "We couldn't save this lead. Please try again." };
  }
}

export async function changeLeadStatus(leadId: string, value: string) {
  const { profile, organization } = await requireOrganization();
  const parsedStatus = leadStatusSchema.safeParse(value);
  if (!parsedStatus.success) return { error: "Choose a valid lead status." };

  try {
    const updated = await prisma.$transaction(async (transaction) => {
      const lead = await transaction.lead.findFirst({
        where: { id: leadId, organizationId: organization.id },
        select: { id: true, status: true },
      });
      if (!lead || lead.status === "WON") return false;
      if (lead.status === parsedStatus.data) return true;

      await transaction.lead.update({ where: { id: lead.id }, data: { status: parsedStatus.data } });
      await transaction.activity.create({
        data: {
          organizationId: organization.id,
          actorId: profile.id,
          leadId: lead.id,
          type: "LEAD_STATUS_CHANGED",
          description: `Lead status changed from ${lead.status} to ${parsedStatus.data}.`,
        },
      });
      return true;
    });

    if (!updated) return { error: "This lead cannot be updated in your workspace." };
    revalidateLeadViews(leadId);
    return { success: true };
  } catch {
    return { error: "We couldn't update the lead status. Please try again." };
  }
}

export async function convertLead(leadId: string) {
  const { profile, organization } = await requireOrganization();

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const lead = await transaction.lead.findFirst({
        where: { id: leadId, organizationId: organization.id },
      });
      if (!lead) return "unavailable" as const;
      if (lead.status !== "QUALIFIED") return "not-qualified" as const;

      const claimed = await transaction.lead.updateMany({
        where: { id: lead.id, organizationId: organization.id, status: "QUALIFIED" },
        data: { status: "WON", convertedAt: new Date() },
      });
      if (claimed.count !== 1) return "not-qualified" as const;

      const client = await transaction.client.create({
        data: {
          organizationId: organization.id,
          leadId: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
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
          description: "Qualified lead was converted into a client.",
        },
      });
      return "converted" as const;
    });

    if (result === "unavailable") return { error: "This lead is unavailable in your workspace." };
    if (result === "not-qualified") return { error: "Only a qualified lead can be converted, and each lead can be converted once." };

    revalidateLeadViews(leadId);
    return { success: true };
  } catch {
    return { error: "We couldn't convert this lead. No changes were saved; please try again." };
  }
}