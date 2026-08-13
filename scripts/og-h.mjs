// Minimal element-tree builder for @vercel/og's ImageResponse (Satori),
// which only needs a React-element-shaped object ({ type, props }) — not
// React itself. Mirrors createElement's children normalization (single
// child stays bare, multiple children become an array) so call sites read
// like JSX without pulling in a JSX runtime or the `react` package.
export function h(type, props = {}, ...children) {
  const flat = children.flat().filter((c) => c !== null && c !== undefined);
  return {
    type,
    props: {
      ...props,
      children: flat.length <= 1 ? (flat[0] ?? undefined) : flat,
    },
  };
}
