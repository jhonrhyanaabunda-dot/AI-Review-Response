"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { CheckCircle2, RefreshCw, Sparkles, XCircle, Wand2 } from "lucide-react";
import { useTypewriter } from "@/hooks/use-typewriter";
import type {
  AiResponse,
  Dealership,
  Review,
  ReviewNote,
  ResponseStatus as RS,
  Escalation,
  ActivityLog,
  Location,
} from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/reviews/rating-stars";
import { PlatformIcon } from "@/components/reviews/platform-icon";
import { SentimentBadge } from "@/components/reviews/sentiment-badge";
import { AgentTimeline } from "@/components/reviews/agent-timeline";
import { useApi } from "@/hooks/use-api";

type FullReview = Review & {
  dealership: Dealership;
  location: Location | null;
  responses: AiResponse[];
  notes: ReviewNote[];
  escalations: Escalation[];
  activityLogs: ActivityLog[];
};

function activeResponse(responses: AiResponse[]) {
  return responses.find((r) => !r.supersededAt) ?? responses[0] ?? null;
}

const RESPONSE_BADGE: Record<RS, "default" | "warning" | "success" | "destructive" | "muted"> = {
  DRAFT: "default",
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  PUBLISHED: "success",
  FAILED: "destructive",
  ESCALATED: "destructive",
};

export function ReviewDetailClient({ review }: { review: FullReview }) {
  const router = useRouter();
  const { request, loading } = useApi();
  const draft = activeResponse(review.responses);
  const [body, setBody] = useState(draft?.finalBody ?? draft?.draftBody ?? "");
  const [generating, setGenerating] = useState(false);
  const [revealText, setRevealText] = useState<string | null>(null);

  // Typewriter only runs while `revealText` is set (just after a regenerate).
  const { shown: typed, done: typedDone } = useTypewriter(revealText ?? "", {
    enabled: !!revealText,
    charsPerTick: 4,
    tickMs: 20,
  });

  const submit = async (decision: "APPROVED" | "REJECTED") => {
    if (!draft) return;
    try {
      await request(`/api/responses/${draft.id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, finalBody: body }),
      });
      toast.success(decision === "APPROVED" ? "Approved & queued for publish" : "Rejected");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const regenerate = async () => {
    if (!draft) return;
    setGenerating(true);
    try {
      await request(`/api/responses/${draft.id}/regenerate`, { method: "POST" });
      // Fetch the freshly created draft so we can animate it in.
      const detail = await fetch(`/api/reviews/${review.id}`, { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => null);
      const fresh =
        detail?.data?.responses?.find((r: { supersededAt: null | Date }) => !r.supersededAt) ??
        null;
      const newBody = fresh?.draftBody ?? draft.draftBody;
      setBody(newBody);
      setRevealText(newBody);
      toast.success("AI generated a new draft");
      // Refresh page in the background so other panels (timeline, etc.) update.
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <PlatformIcon platform={review.platform} withLabel />
                <RatingStars value={review.rating} />
              </div>
              <CardTitle className="text-xl">{review.authorName ?? "Anonymous"}</CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{review.dealership.name}</span>
                {review.location && <span>· {review.location.name}</span>}
                <span>· {format(review.postedAt, "PPP")}</span>
              </div>
            </div>
            <SentimentBadge value={review.sentiment} />
          </CardHeader>
          <CardContent>
            {review.title && <h3 className="mb-2 font-medium">{review.title}</h3>}
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{review.body}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">AI-generated response</CardTitle>
              {draft && (
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={RESPONSE_BADGE[draft.status]} className="capitalize">
                    {draft.status.replace("_", " ").toLowerCase()}
                  </Badge>
                  <span>{Math.round(draft.confidence * 100)}% confidence</span>
                  {draft.flaggedReasons.length > 0 && (
                    <span className="text-warning">⚠ {draft.flaggedReasons.join(", ")}</span>
                  )}
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={regenerate} disabled={loading || generating}>
              <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Generating…" : "Regenerate"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {!draft ? (
              <div className="flex items-center justify-center gap-2 rounded-md border border-dashed p-8 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                Waiting for AI to generate a draft…
              </div>
            ) : generating || (revealText && !typedDone) ? (
              // Live-AI moment: stream the new draft in character-by-character.
              <div className="relative rounded-md border bg-primary/5 p-4 text-sm leading-relaxed">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary">
                  <Wand2 className="h-3.5 w-3.5 animate-pulse" />
                  AI is writing…
                </div>
                <pre className="whitespace-pre-wrap font-sans text-foreground">
                  {typed}
                  <span className="ml-0.5 inline-block h-3.5 w-[2px] -mb-0.5 bg-primary align-middle animate-pulse" />
                </pre>
              </div>
            ) : (
              <>
                <Textarea
                  rows={8}
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    setRevealText(null);
                  }}
                  disabled={["PUBLISHED", "REJECTED", "FAILED"].includes(draft.status)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => submit("REJECTED")} disabled={loading}>
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                  <Button variant="success" onClick={() => submit("APPROVED")} disabled={loading}>
                    <CheckCircle2 className="h-4 w-4" /> Approve & publish
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <AgentTimeline entries={review.activityLogs} />

        {review.escalations.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base text-destructive">Escalations</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {review.escalations.map((e) => (
                <div key={e.id} className="rounded border p-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="destructive">{e.severity}</Badge>
                    {e.resolvedAt ? <Badge variant="success">resolved</Badge> : <Badge variant="warning">open</Badge>}
                  </div>
                  <p className="mt-2 text-xs">{e.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
