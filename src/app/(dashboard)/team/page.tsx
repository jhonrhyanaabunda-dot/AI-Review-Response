import { requirePermission } from "@/server/rbac/guard";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const ctx = await requirePermission("members:read");
  const members = await prisma.membership.findMany({
    where: { organizationId: ctx.organizationId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, lastLoginAt: true } },
      dealership: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Team</h2>
        <p className="text-sm text-muted-foreground">{members.length} member{members.length === 1 ? "" : "s"}.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Members</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-3">
              <Avatar>
                {m.user.image && <AvatarImage src={m.user.image} />}
                <AvatarFallback>{(m.user.name ?? m.user.email).slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{m.user.name ?? m.user.email}</div>
                <div className="text-xs text-muted-foreground">{m.user.email}</div>
              </div>
              <div className="flex items-center gap-2">
                {m.dealership && <Badge variant="outline">{m.dealership.name}</Badge>}
                <Badge>{m.role.replace("_", " ")}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
