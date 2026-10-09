import { ClientsWorkspace } from "@/components/clients/clients-workspace";
import { requireOrganization } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";

export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  const { organization } = await requireOrganization();
  const query = await searchParams;

  let clients: Array<{
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    status: "ACTIVE" | "INACTIVE";
    createdAt: Date;
  }> = [];
  let loadError = false;

  try {
    clients = await prisma.client.findMany({
      where: { organizationId: organization.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, company: true, email: true, status: true, createdAt: true },
    });
  } catch (error) {
    console.error("Clients list failed to load.", error);
    loadError = true;
  }

  const activities = clients.length ? await prisma.activity.groupBy({
    by: ["clientId"],
    where: { organizationId: organization.id, clientId: { in: clients.map((client) => client.id) } },
    _max: { createdAt: true },
  }).catch((error: unknown) => {
    console.error("Clients activity lookup failed.", error);
    return [] as Array<{ clientId: string | null; _max: { createdAt: Date | null } }>;
  }) : [] as Array<{ clientId: string | null; _max: { createdAt: Date | null } }>;
  const lastActivityByClient = new Map<string, Date>();
  for (const activity of activities) {
    const lastCreatedAt = activity._max?.createdAt;
    if (activity.clientId && lastCreatedAt) {
      lastActivityByClient.set(activity.clientId, lastCreatedAt);
    }
  }

  return (
    <ClientsWorkspace
      deletionComplete={query.deleted === "1"}
      loadError={loadError}
      clients={clients.map((client) => ({
        ...client,
        createdAtLabel: client.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        lastActivityLabel: lastActivityByClient.get(client.id)?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) ?? null,
      }))}
    />
  );
}