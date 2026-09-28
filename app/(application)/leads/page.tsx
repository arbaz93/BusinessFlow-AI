import { LeadsWorkspace } from "@/components/leads/leads-workspace";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const { organization } = await requireOrganization();
  const [leads, qualifiedCount, convertedCount, query] = await Promise.all([
    prisma.lead.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        company: true,
        email: true,
        phone: true,
        source: true,
        status: true,
        estimatedValue: true,
        currency: true,
        createdAt: true,
        convertedAt: true,
        client: { select: { id: true } },
      },
    }),
    prisma.lead.count({ where: { organizationId: organization.id, status: "QUALIFIED" } }),
    prisma.lead.count({ where: { organizationId: organization.id, convertedAt: { not: null } } }),
    searchParams,
  ]);

  return (
    <LeadsWorkspace
      leads={leads.map((lead) => ({
        ...lead,
        estimatedValue: lead.estimatedValue?.toString() ?? null,
        createdAtLabel: lead.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        converted: lead.convertedAt !== null || lead.client !== null,
      }))}
      qualifiedCount={qualifiedCount}
      convertedCount={convertedCount}
      deletionComplete={query.deleted === "1"}
    />
  );
}