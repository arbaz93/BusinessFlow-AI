import { LeadsWorkspace } from "@/components/leads/leads-workspace";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const { organization } = await requireOrganization();
  let leads: Array<{
    id: string;
    name: string;
    company: string | null;
    email: string;
    phone: string | null;
    source: string;
    status: "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL_SENT" | "WON" | "LOST";
    estimatedValue: { toString(): string } | null;
    currency: string;
    createdAt: Date;
    convertedAt: Date | null;
    client: { id: string } | null;
  }> = [];
  let qualifiedCount = 0;
  let convertedCount = 0;
  let loadError = false;

  try {
    const result = await Promise.all([
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
    ]);

    [leads, qualifiedCount, convertedCount] = result;
  } catch (error) {
    console.error("Leads list failed to load.", error);
    loadError = true;
  }

  const query = await searchParams;

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
      loadError={loadError}
    />
  );
}