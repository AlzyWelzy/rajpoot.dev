// The Open Graph card's visual tree. Bundled and rendered by
// scripts/generate-static-images.mjs — not run directly, and not part of
// the Next.js app (see that file for why this isn't a plain
// app/opengraph-image.tsx route anymore).
import { siteConfig } from "@/lib/seo";

export const size = { width: 1200, height: 630 };

export default function OgImage() {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background:
          "linear-gradient(135deg, #0b1020 0%, #1e1b4b 50%, #312e81 100%)",
        color: "#f8fafc",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          fontSize: 28,
          opacity: 0.85,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 9999,
            background: "#f8fafc",
            color: "#0b1020",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 26,
          }}
        >
          MR
        </div>
        <div>{new URL(siteConfig.url).host}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>
          {siteConfig.name}
        </div>
        <div style={{ fontSize: 34, opacity: 0.9 }}>{siteConfig.roleline}</div>
        <div style={{ fontSize: 28, opacity: 0.7, maxWidth: 940 }}>
          Building scalable, secure, AI-powered systems & robust APIs.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          fontSize: 22,
          opacity: 0.85,
        }}
      >
        {siteConfig.ogTags.map((tag) => (
          <div
            key={tag}
            style={{
              padding: "8px 16px",
              borderRadius: 9999,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
}
