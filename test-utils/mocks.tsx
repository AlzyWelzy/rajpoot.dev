import { createElement, type ReactNode } from "react";

/**
 * Shared module mocks for the component tests. These used to be copy-pasted
 * into every spec file (four near-identical motion proxies that drifted apart
 * over time); they live here so there is one definition to fix.
 *
 * Use with an async `vi.mock` factory so the import happens after hoisting:
 *
 *   vi.mock("motion/react", async () => (await import("@/test-utils/mocks")).motionMock());
 */

/** Props that exist only for motion and must not reach the DOM. */
const MOTION_ONLY_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "whileInView",
  "whileHover",
  "whileTap",
  "whileFocus",
  "transition",
  "viewport",
  "variants",
  "custom",
  "layout",
  "layoutId",
]);

/**
 * Renders every `m.*` as the plain DOM element it wraps. Where a
 * `variants.animate` callback is present it is invoked with `custom`, the way
 * the real runtime would — otherwise stagger/variant functions would look dead
 * to the test.
 */
export function motionMock() {
  return {
    m: new Proxy(
      {},
      {
        get: (_target, tag: string) => (props: Record<string, unknown>) => {
          const variants = props.variants as
            { animate?: (custom: unknown) => unknown } | undefined;
          if (
            typeof variants?.animate === "function" &&
            props.custom !== undefined
          ) {
            variants.animate(props.custom);
          }
          return createElement(
            tag,
            Object.fromEntries(
              Object.entries(props).filter(
                ([key]) => !MOTION_ONLY_PROPS.has(key),
              ),
            ),
          );
        },
      },
    ),
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    LazyMotion: ({ children }: { children: ReactNode }) => children,
    MotionConfig: ({ children }: { children: ReactNode }) => children,
    domAnimation: {},
    useScroll: () => ({ scrollYProgress: 0 }),
    useSpring: (value: unknown) => value,
  };
}

/** jsdom has no IntersectionObserver; the hook only needs a ref + inView. */
export function intersectionObserverMock(inView = false) {
  return { useInView: () => ({ ref: () => {}, inView }) };
}

/** next/image, minus the props that only mean something to the Next runtime. */
export function nextImageMock() {
  const nextOnly = new Set([
    "priority",
    "placeholder",
    "blurDataURL",
    "fetchPriority",
  ]);
  return {
    default: (props: Record<string, unknown>) => {
      const rest = Object.fromEntries(
        Object.entries(props).filter(([key]) => !nextOnly.has(key)),
      );
      const src = rest.src;
      return createElement("img", {
        ...rest,
        src: typeof src === "string" ? src : (src as { src: string }).src,
      });
    },
  };
}

/** Static image import — resolved by Next at build time, not by vitest. */
export function profileImageMock() {
  return {
    default: { src: "/profile.jpg", width: 96, height: 96, blurDataURL: "" },
  };
}

/** Plain anchor, so click handlers fire without an App Router context. */
export function nextLinkMock() {
  return {
    default: ({
      children,
      ...props
    }: { children: ReactNode } & Record<string, unknown>) =>
      createElement("a", props, children),
  };
}
