import { ClientsWorkspace } from "@/components/clients/clients-workspace";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";

export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  const { organization } = await requireOrganization();
  const query = await searchParams;
  const clients = await prisma.client.findMany({
    where: { organizationId: organization.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, company: true, email: true, status: true, createdAt: true },
  });
  const activities = clients.length ? await prisma.activity.groupBy({
    by: ["clientId"],
    where: { organizationId: organization.id, clientId: { in: clients.map((client) => client.id) } },
    _max: { createdAt: true },
  }) : [];
  const lastActivityByClient = new Map<string, Date>();
  for (const activity of activities) {
    if (activity.clientId && activity._max.createdAt) {
      lastActivityByClient.set(activity.clientId, activity._max.createdAt);
    }
  }

  return (
    <ClientsWorkspace deletionComplete={query.deleted === "1"} clients={clients.map((client) => ({
      ...client,
      createdAtLabel: client.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      lastActivityLabel: lastActivityByClient.get(client.id)?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) ?? null,
    }))} />
  );
}