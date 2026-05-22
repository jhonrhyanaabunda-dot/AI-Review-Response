import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">404</h1>
        <p className="text-sm text-muted-foreground">That page doesn't exist.</p>
        <Button asChild>
          <Link href="/">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
