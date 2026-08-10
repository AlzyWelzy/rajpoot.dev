"use client";

import { useEffect } from "react";
import Button from "@/components/button";

/**
 * Route-level error boundary. Catches render/runtime errors in the page tree
 * (the root layout still renders around it) and offers a recovery path instead
 * of a blank screen. `global-error.tsx` handles failures in the layout itself.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the cause in the browser console. This boundary only catches
    // client-side render errors, so there is no server-side counterpart to
    // rely on for capture here — wire up Workers Logs or an error tracker if
    // that's needed.
    console.error(error);
  }, [error]);

  return (
    <main
      id="main"
      tabIndex={-1}
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center outline-none"
    >
      <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-white/60">
        Something broke
      </p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
        This page hit an error.
      </h1>
      <p className="mt-4 max-w-md text-gray-600 dark:text-white/70">
        Sorry about that. You can try again, or head back to the homepage.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button href="/" variant="secondary">
          Back to home
        </Button>
      </div>
    </main>
  );
}
