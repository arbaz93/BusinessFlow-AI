"use server";

import { z } from "zod";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";

export type GlobalSearchResultItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export type GlobalSearchGroup = {
  label: string;
  items: GlobalSearchResultItem[];
};

const searchTermSchema = z.string().trim().min(1).max(120);

function normalizeSearchTerms(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export async function globalSearch(rawQuery: string): Promise<{ groups: GlobalSearchGroup[]; total: number }> {
  const parsed = searchTermSchema.safeParse(rawQuery);
  if (!parsed.success) {
    return { groups: [], total: 0 };
  }

  const { organization } = await requireOrganization();
  const terms = normalizeSearchTerms(parsed.data);

  if (!terms.length) {
    return { groups: [], total: 0 };
  }

  const orMatches = (fields: string[]) =>
    terms.flatMap((term) =>
      fields.map((field) => ({
        [field]: { contains: term, mode: "insensitive" as const },
      })),
    );

  const [leads, clients, projects, tasks] = await Promise.all([
    prisma.lead.findMany({
      where: {
        organizationId: organization.id,
        OR: orMatches(["name", "email", "company", "phone", "source", "notes"]),
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, name: true, company: true, email: true, updatedAt: true },
    }),
    prisma.client.findMany({
      where: {
        organizationId: organization.id,
        OR: orMatches(["name", "email", "company", "notes"]),
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, name: true, company: true, email: true, updatedAt: true },
    }),
    prisma.project.findMany({
      where: {
        organizationId: organization.id,
        OR: orMatches(["name", "description", "notes"]),
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        description: true,
        client: { select: { name: true, company: true } },
        updatedAt: true,
      },
    }),
    prisma.task.findMany({
      where: {
        organizationId: organization.id,
        OR: orMatches(["title", "description"]),
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        project: { select: { name: true, client: { select: { name: true, company: true } } } },
        updatedAt: true,
      },
    }),
  ]);

  const groups: GlobalSearchGroup[] = [
    {
      label: "Leads",
      items: leads.map((lead) => ({
        id: lead.id,
        title: lead.name,
        subtitle: lead.company || lead.email || "Lead record",
        href: `/leads/${lead.id}`,
      })),
    },
    {
      label: "Clients",
      items: clients.map((client) => ({
        id: client.id,
        title: client.name,
        subtitle: client.company || client.email || "Client record",
        href: `/clients/${client.id}`,
      })),
    },
    {
      label: "Projects",
      items: projects.map((project) => ({
        id: project.id,
        title: project.name,
        subtitle: project.client.company || project.client.name || "Project record",
        href: `/projects/${project.id}`,
      })),
    },
    {
      label: "Tasks",
      items: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        subtitle: task.project.name || "Task record",
        href: `/tasks/${task.id}`,
      })),
    },
  ];

  const filteredGroups = groups.filter((group) => group.items.length > 0);

  return {
    total: filteredGroups.reduce((sum, group) => sum + group.items.length, 0),
    groups: filteredGroups,
  };
}
