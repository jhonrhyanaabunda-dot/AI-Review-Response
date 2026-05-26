/**
 * Inline SVG diagram of the 5-pillar response loop. Hover-able dots,
 * gradient stroke, rotating dasharray for a subtle "alive" feel.
 */
import type { MethodologyPillar } from "@/lib/demo/config";

const RADIUS = 130;
const CENTER = 160;
const SIZE = 320;

export function LoopDiagram({ pillars }: { pillars: MethodologyPillar[] }) {
  if (pillars.length === 0) return null;
  const step = (Math.PI * 2) / pillars.length;
  // Start at the top.
  const positions = pillars.map((_, i) => {
    const angle = -Math.PI / 2 + step * i;
    return {
      x: CENTER + Math.cos(angle) * RADIUS,
      y: CENTER + Math.sin(angle) * RADIUS,
    };
  });

  return (
    <div className="relative mx-auto w-full max-w-md">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-auto w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="loop-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
          </linearGradient>
          <radialGradient id="loop-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.08} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Background glow */}
        <circle cx={CENTER} cy={CENTER} r={RADIUS + 20} fill="url(#loop-bg)" />

        {/* Animated dashed loop */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="url(#loop-stroke)"
          strokeWidth={2}
          strokeDasharray="4 8"
          style={{
            animation: "loopRotate 30s linear infinite",
            transformOrigin: `${CENTER}px ${CENTER}px`,
          }}
        />

        {/* Pillar dots */}
        {positions.map((pos, i) => {
          const pillar = pillars[i]!;
          return (
            <g key={pillar.key}>
              {/* halo */}
              <circle cx={pos.x} cy={pos.y} r={26} fill="hsl(var(--background))" />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={24}
                fill="hsl(var(--primary))"
                opacity={0.12}
              >
                <animate
                  attributeName="r"
                  values="22;28;22"
                  dur="3s"
                  begin={`${i * 0.4}s`}
                  repeatCount="indefinite"
                />
              </circle>
              {/* center */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={20}
                fill="hsl(var(--background))"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
              <text
                x={pos.x}
                y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground"
                style={{ fontSize: 13, fontWeight: 800 }}
              >
                {pillar.step}
              </text>
              {/* label */}
              <text
                x={pos.x}
                y={pos.y + 40}
                textAnchor="middle"
                className="fill-foreground"
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4 }}
              >
                {pillar.name.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Center label */}
        <g>
          <text
            x={CENTER}
            y={CENTER - 12}
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2 }}
          >
            MEDIAN
          </text>
          <text
            x={CENTER}
            y={CENTER + 14}
            textAnchor="middle"
            className="fill-foreground"
            style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}
          >
            90s
          </text>
          <text
            x={CENTER}
            y={CENTER + 32}
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ fontSize: 10, fontWeight: 500 }}
          >
            ingest → published
          </text>
        </g>
      </svg>
      <style>{`
        @keyframes loopRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
