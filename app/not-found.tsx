import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  // Must set noindex explicitly: without it the page inherits the root layout's
  // `index: true`, which would conflict with Next's injected not-found noindex.
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center outline-none"
    >
      <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-white/60">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
        This page wandered off.
      </h1>
      <p className="mt-4 max-w-md text-gray-600 dark:text-white/70">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
        Let&apos;s get you back on track.
      </p>
      <Link
        href="/"
        className="group mt-8 inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-white outline-none transition hover:scale-110 hover:bg-gray-950 focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 active:scale-105 dark:bg-white/10"
      >
        Back to home
      </Link>
    </main>
  );
}
