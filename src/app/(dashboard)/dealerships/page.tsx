import Link from "next/link";
import { requirePermission } from "@/server/rbac/guard";
import { listDealerships } from "@/server/services/dealerships";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DealershipsPage() {
  const ctx = await requirePermission("dealerships:read");
  const rows = await listDealerships(ctx.organizationId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Rooftops
          </span>
          <h2 className="mt-1 text-2xl font-black tracking-tight md:text-display-3">Dealerships</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} rooftop group{rows.length === 1 ? "" : "s"} under this agency.
          </p>
        </div>
        <Button asChild>
          <Link href="/dealerships/new">Add dealership</Link>
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((d) => (
          <Card key={d.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{d.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{d.brand ?? "-"}</p>
              </div>
              <Badge variant="outline">{d.tonePreset}</Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <span>{d._count.locations} locations</span>
                <span>·</span>
                <span>{d._count.reviews} reviews</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
            No dealerships yet. Create one to start ingesting reviews.
          </div>
        )}
      </div>
    </div>
  );
}
