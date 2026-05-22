import { Globe, Star, Car, Facebook, Building2, ShieldCheck } from "lucide-react";
import type { ReviewPlatform } from "@prisma/client";

const MAP: Record<ReviewPlatform, { Icon: typeof Globe; label: string; color: string }> = {
  GOOGLE: { Icon: Globe, label: "Google", color: "text-sky-500" },
  YELP: { Icon: Star, label: "Yelp", color: "text-red-500" },
  DEALERRATER: { Icon: Building2, label: "DealerRater", color: "text-emerald-500" },
  CARS_DOT_COM: { Icon: Car, label: "Cars.com", color: "text-orange-500" },
  FACEBOOK: { Icon: Facebook, label: "Facebook", color: "text-blue-500" },
  BBB: { Icon: ShieldCheck, label: "BBB", color: "text-indigo-500" },
};

export function PlatformIcon({ platform, withLabel = false }: { platform: ReviewPlatform; withLabel?: boolean }) {
  const { Icon, label, color } = MAP[platform];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      {withLabel && <span className="text-muted-foreground">{label}</span>}
    </span>
  );
}
