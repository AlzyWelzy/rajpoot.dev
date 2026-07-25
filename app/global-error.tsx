"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown by the root layout itself. Next renders
 * this *instead of* the layout, so it must ship its own <html>/<body> and can't
 * rely on the app's fonts, theme, or globals.css — hence the inline styles.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#0b1020",
          color: "#f8fafc",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.75rem", margin: "0 0 0.75rem" }}>
            Something went wrong
          </h1>
          <p style={{ opacity: 0.75, margin: "0 0 1.5rem", lineHeight: 1.6 }}>
            The page failed to load. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              cursor: "pointer",
              borderRadius: "9999px",
              border: "none",
              background: "#f8fafc",
              color: "#0b1020",
              padding: "0.75rem 1.75rem",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
