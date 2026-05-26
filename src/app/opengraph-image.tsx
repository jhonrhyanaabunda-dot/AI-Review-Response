/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "A3 Brands AI Review Response - every review answered, approved with one click.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0B1220",
          color: "white",
          display: "flex",
          flexDirection: "column",
          padding: "72px",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 20% 20%, rgba(29,185,84,0.30), transparent 50%), radial-gradient(circle at 80% 60%, rgba(29,185,84,0.15), transparent 50%)",
          }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: "rgba(29,185,84,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 800,
                color: "#1DB954",
              }}
            >
              A3
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>A3 BRANDS</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 2 }}>
                AI Review Response
              </div>
            </div>
          </div>
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", fontSize: 80, fontWeight: 800, letterSpacing: -2, lineHeight: 1.0 }}>
              Every review answered.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 56,
                fontWeight: 800,
                letterSpacing: -1.5,
                color: "#1DB954",
                lineHeight: 1.05,
              }}
            >
              Approved with one click.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                color: "rgba(255,255,255,0.7)",
                marginTop: 16,
              }}
            >
              Google · Yelp · Cars.com · DealerRater · Facebook · BBB
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
