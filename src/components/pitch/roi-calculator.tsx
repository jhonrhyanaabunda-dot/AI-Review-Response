"use client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Clock, DollarSign, Zap } from "lucide-react";
import type { RoiDefaults } from "@/lib/demo/config";

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-baseline justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span className="text-base font-black tracking-tight text-foreground">
          {value.toLocaleString()}
          {suffix ?? ""}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

function formatHours(h: number) {
  if (h >= 8) return `${(h / 8).toFixed(1)} workdays`;
  return `${h.toFixed(1)} hours`;
}

export function RoiCalculator({ defaults }: { defaults: RoiDefaults }) {
  const [reviewsPerMonth, setReviewsPerMonth] = useState(defaults.reviewsPerMonth);
  const [hourlyRate, setHourlyRate] = useState(defaults.hourlyRate);
  const [currentResponseHours, setCurrentResponseHours] = useState(
    defaults.currentResponseHours,
  );

  const results = useMemo(() => {
    const minutesToday = reviewsPerMonth * defaults.minutesPerReplyToday;
    const minutesWithA3 = reviewsPerMonth * defaults.minutesPerReplyWithA3;
    const minutesSaved = Math.max(0, minutesToday - minutesWithA3);
    const hoursSaved = minutesSaved / 60;
    const dollarsSaved = hoursSaved * hourlyRate;
    const responseTimeImprovement = Math.max(
      0,
      ((currentResponseHours * 3600 - 90) / (currentResponseHours * 3600)) * 100,
    );
    const annualDollarsSaved = dollarsSaved * 12;
    return {
      minutesToday,
      minutesWithA3,
      hoursSaved,
      dollarsSaved,
      annualDollarsSaved,
      responseTimeImprovement,
    };
  }, [reviewsPerMonth, hourlyRate, currentResponseHours, defaults]);

  return (
    <Card className="overflow-hidden border-border/60">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">ROI for your dealership</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          Drag the sliders to match your reality - the numbers update live.
        </p>
      </CardHeader>
      <CardContent className="grid gap-8 p-6 md:grid-cols-2">
        <div className="space-y-6">
          <NumberInput
            label="Reviews per month"
            value={reviewsPerMonth}
            onChange={setReviewsPerMonth}
            min={10}
            max={1000}
            step={10}
          />
          <NumberInput
            label="Cost of the person writing replies today"
            value={hourlyRate}
            onChange={setHourlyRate}
            min={15}
            max={100}
            step={5}
            suffix=" /hr"
          />
          <NumberInput
            label="Current avg response time"
            value={currentResponseHours}
            onChange={setCurrentResponseHours}
            min={1}
            max={168}
            step={1}
            suffix=" hrs"
          />
          <div className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
            Assumes {defaults.minutesPerReplyToday} min per reply today vs {defaults.minutesPerReplyWithA3} min
            with A3 (1-click GM approval). Adjust in <code className="rounded bg-muted px-1 py-0.5">demo-data/fixture.json</code>.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          <div className="rounded-lg border bg-success/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-success">
              <Clock className="h-3.5 w-3.5" /> Time saved / month
            </div>
            <div className="mt-1 text-3xl font-black tracking-tight">
              {formatHours(results.hoursSaved)}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {results.minutesToday.toLocaleString()} min → {results.minutesWithA3.toLocaleString()} min
            </div>
          </div>
          <div className="rounded-lg border bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <DollarSign className="h-3.5 w-3.5" /> Labor cost saved
            </div>
            <div className="mt-1 text-3xl font-black tracking-tight">
              ${Math.round(results.dollarsSaved).toLocaleString()}
              <span className="ml-1 text-sm font-medium text-muted-foreground">/ mo</span>
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              ${Math.round(results.annualDollarsSaved).toLocaleString()} / year
            </div>
          </div>
          <div className="col-span-full rounded-lg border bg-warning/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warning">
              <Zap className="h-3.5 w-3.5" /> Response time
            </div>
            <div className="mt-1 text-3xl font-black tracking-tight">
              {results.responseTimeImprovement.toFixed(1)}% faster
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {currentResponseHours} hrs → 90 seconds median
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
