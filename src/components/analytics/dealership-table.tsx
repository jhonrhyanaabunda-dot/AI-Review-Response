import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RatingStars } from "@/components/reviews/rating-stars";

type Row = {
  dealership: { id: string; name: string; brand?: string | null } | null;
  reviews: number;
  avgRating: number;
};

export function DealershipTable({ rows }: { rows: Row[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>By dealership</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Dealership</th>
                <th className="px-4 py-2 text-left">Brand</th>
                <th className="px-4 py-2 text-left">Reviews</th>
                <th className="px-4 py-2 text-left">Avg rating</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No data in range
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.dealership?.id ?? i} className="border-t">
                  <td className="px-4 py-2 font-medium">{r.dealership?.name ?? "-"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.dealership?.brand ?? "-"}</td>
                  <td className="px-4 py-2">{r.reviews}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <RatingStars value={Math.round(r.avgRating)} />
                      <span className="text-muted-foreground">{r.avgRating.toFixed(2)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
