// Purely decorative, and it only ever played one mount animation — a CSS
// keyframe does that without making this a client component or pulling motion
// into the module graph.
export default function SectionDivider() {
  return (
    <div
      aria-hidden="true"
      className="divider-rise bg-gray-200 my-24 h-16 w-1 rounded-full hidden sm:block dark:bg-gray-200/20"
    />
  );
}
