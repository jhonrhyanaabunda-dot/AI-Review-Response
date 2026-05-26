/**
 * Per-prospect demo overlays.
 *
 * Drop a JSON file in /prospects/ at the repo root and visit
 * /p/<slug-without-.json> to brand the demo for that prospect. The slug
 * persists in the visitor's cookie so all dashboard pages render with
 * their org name and dealership names.
 */
import wilsonBmw from "../../../prospects/wilson-bmw.json";
import metroAutoGroup from "../../../prospects/metro-auto-group.json";

export type Prospect = {
  slug: string;
  orgName: string;
  tagline?: string;
  dealerships?: Array<{
    name?: string;
    brand?: string;
    signOff?: string;
  }>;
};

const PROSPECTS: Record<string, Prospect> = {
  "wilson-bmw": wilsonBmw as Prospect,
  "metro-auto-group": metroAutoGroup as Prospect,
};

export function loadProspect(slug: string): Prospect | null {
  return PROSPECTS[slug] ?? null;
}

export function listProspectSlugs(): string[] {
  return Object.keys(PROSPECTS);
}
