export default function Loading() {
  return (
    <main
      id="main"
      tabIndex={-1}
      aria-busy="true"
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center outline-none"
    >
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white"
      />
      <span className="sr-only">Loading…</span>
    </main>
  );
}
