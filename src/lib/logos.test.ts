import { describe, expect, it } from "vitest";

import { logos, type LogoName } from "./logos";

const names = Object.keys(logos) as LogoName[];

describe("logo data URIs", () => {
  it.each(names)("%s is an svg data URI", (name) => {
    expect(logos[name]).toMatch(/^data:image\/svg\+xml,/);
  });

  it.each(names)(
    "%s escapes every character a data URL can't carry",
    (name) => {
      const payload = logos[name].slice("data:image/svg+xml,".length);
      // An unescaped `#` truncates the URL at the fragment, and unescaped
      // angle brackets/quotes break the surrounding `src="…"` attribute.
      expect(payload).not.toMatch(/[<>"#]/);
    },
  );

  it.each(names)("%s decodes back to the original SVG markup", (name) => {
    const decoded = decodeURIComponent(
      logos[name].slice("data:image/svg+xml,".length),
    );
    expect(decoded.startsWith("<svg")).toBe(true);
    expect(decoded.trimEnd().endsWith("</svg>")).toBe(true);
  });

  it("collapses whitespace rather than percent-encoding it", () => {
    // encodeURIComponent would turn every space into %20 and roughly double
    // the payload; the point of the hand-rolled escape is to avoid that.
    const payload = logos[names[0]!];
    expect(payload).not.toContain("%20");
    expect(payload).not.toContain("\n");
  });
});
