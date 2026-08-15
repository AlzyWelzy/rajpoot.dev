import { describe, expect, it } from "vitest";

import { icons, renderIcon, type IconName } from "./icons";

const names = Object.keys(icons) as IconName[];

describe("icon markup", () => {
  it.each(names)("%s is a single well-formed <svg> element", (name) => {
    const svg = icons[name];
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg.match(/<svg/g)).toHaveLength(1);
  });

  it.each(names)("%s carries a viewBox with the correct casing", (name) => {
    // `viewBox` is one of the few case-sensitive SVG attributes; hyphenating
    // or lowercasing it while converting from React prop names silently
    // breaks scaling.
    expect(icons[name]).toMatch(/ viewBox="0 0 \d+ \d+"/);
    expect(icons[name]).not.toMatch(/view-box|viewbox=/);
  });

  it.each(names)("%s paints from currentColor only", (name) => {
    // Icons inherit the surrounding text colour in both themes; a literal
    // colour would survive a theme switch and become invisible.
    expect(icons[name]).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
  });
});

describe("renderIcon", () => {
  // The regression this guards: matching on `"<svg "` (trailing space) found
  // nothing in pretty-printed source files, so icons shipped unstyled and
  // exposed to assistive tech. Every entry must actually take the injection.
  it.each(names)("injects attributes into %s", (name) => {
    const html = renderIcon(name, { class: "h-4 w-4" });
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="h-4 w-4"');
    expect(html.startsWith('<svg aria-hidden="true" class="h-4 w-4" ')).toBe(
      true,
    );
  });

  it("keeps the original geometry intact", () => {
    const html = renderIcon("lu-code");
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain(icons["lu-code"].replace("<svg", ""));
  });

  it("omits the class attribute when no class is given", () => {
    expect(renderIcon("bs-sun")).not.toContain("class=");
  });

  it("adds data-icon only when asked", () => {
    expect(renderIcon("bs-sun")).not.toContain("data-icon");
    expect(renderIcon("bs-sun", { dataIcon: "sun" })).toContain(
      'data-icon="sun"',
    );
  });
});
