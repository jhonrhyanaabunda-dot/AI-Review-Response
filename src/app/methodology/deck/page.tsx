import type { Metadata } from "next";
import { config } from "@/lib/demo/config";
import { DeckClient } from "./deck-client";

export const metadata: Metadata = {
  title: "Methodology deck",
  description:
    "The 90-Second Response Method - presentation-ready slide deck. View, print to PDF, or download as .pptx.",
};

export default function DeckPage() {
  return <DeckClient methodology={config.methodology} config={config} />;
}
