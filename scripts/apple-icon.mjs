// The apple-touch-icon's visual tree. Bundled and rendered by
// scripts/generate-static-images.mjs — not run directly. Mirrors
// public/icon.svg: a deep squircle with a cyan->indigo->fuchsia gradient "M".
import { h } from "./og-h.mjs";

export const size = { width: 180, height: 180 };

export default function appleIcon() {
  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(120% 120% at 30% 18%, #2e1c6b 0%, #1a1148 38%, #080913 100%)",
      },
    },
    h(
      "div",
      {
        style: {
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
        },
      },
      "M",
    ),
  );
}
