import { ImageResponse } from "next/og";

// Generated at build time as a real 180x180 PNG (Safari ignores SVG/manifest
// icons and a JPG apple-touch-icon is non-standard). Mirrors public/icon.svg:
// a deep squircle with a cyan->indigo->fuchsia gradient "M".
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(120% 120% at 30% 18%, #2e1c6b 0%, #1a1148 38%, #080913 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 128,
            fontWeight: 800,
            letterSpacing: -8,
            fontFamily: "system-ui, sans-serif",
            backgroundImage:
              "linear-gradient(135deg, #2dd4ef 0%, #6366f1 52%, #e879f9 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          M
        </div>
      </div>
    ),
    { ...size },
  );
}
