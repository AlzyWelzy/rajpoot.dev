"use client";

import { useEffect } from "react";
import Link from "next/link";

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
    // Surface the cause locally; Vercel also captures it server-side.
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
        <button
          type="button"
          onClick={reset}
          className="group inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-white outline-none transition hover:scale-110 hover:bg-gray-950 focus-ring active:scale-105 dark:bg-white/10"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-black/15 px-7 py-3 font-medium text-gray-800 outline-none transition hover:scale-105 hover:bg-black/5 focus-ring active:scale-100 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/10"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
