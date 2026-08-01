import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";

// Behaviour of the interactive chrome: the theme toggle, the back-to-top
// button, the header's active-section pill, and the data-driven branches of
// the project/testimonial cards.

vi.mock("motion/react", async () =>
  (await import("@/test-utils/mocks")).motionMock(),
);
vi.mock("react-intersection-observer", async () =>
  (await import("@/test-utils/mocks")).intersectionObserverMock(),
);
vi.mock("next/link", async () =>
  (await import("@/test-utils/mocks")).nextLinkMock(),
);

import ThemeContextProvider from "@/context/theme-context";
import ActiveSectionContextProvider from "@/context/active-section-context";
import ThemeSwitch from "./theme-switch";
import ScrollToTop from "./scroll-to-top";
import ReadingProgress from "./reading-progress";
import MotionProvider from "./motion-provider";
import Header from "./header";
import Project from "./project";
import ContactFormEmail from "@/email/contact-form-email";

afterEach(cleanup);

describe("ThemeSwitch", () => {
  it("toggles label and pressed state between light and dark", () => {
    render(
      <ThemeContextProvider>
        <ThemeSwitch />
      </ThemeContextProvider>,
    );
    const btn = screen.getByRole("button", { name: /switch to dark mode/i });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(btn);
    expect(
      screen.getByRole("button", { name: /switch to light mode/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});

describe("ScrollToTop", () => {
  it("appears past one viewport and scrolls to the top on click", () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
    });

    render(<ScrollToTop />);
    expect(
      screen.queryByRole("button", { name: /scroll back to top/i }),
    ).not.toBeInTheDocument();

    Object.defineProperty(window, "scrollY", {
      value: 2000,
      configurable: true,
    });
    fireEvent.scroll(window);

    fireEvent.click(
      screen.getByRole("button", { name: /scroll back to top/i }),
    );
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});

describe("ReadingProgress", () => {
  it("is decorative — hidden from assistive tech, not a status role", () => {
    const { container } = render(<ReadingProgress />);
    const bar = container.firstElementChild;
    // The section nav is the real wayfinding; a screen reader announcing a
    // scroll percentage on every frame would be noise, not information.
    expect(bar).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});

describe("MotionProvider", () => {
  it("renders its children", () => {
    render(
      <MotionProvider>
        <span>child</span>
      </MotionProvider>,
    );
    expect(screen.getByText("child")).toBeInTheDocument();
  });
});

describe("Header navigation", () => {
  function renderHeader() {
    return render(
      <ActiveSectionContextProvider>
        <Header />
      </ActiveSectionContextProvider>,
    );
  }

  const nav = () => screen.getByRole("navigation", { name: "Primary" });

  it("marks a link active on click", () => {
    renderHeader();
    fireEvent.click(within(nav()).getByRole("link", { name: "Projects" }));
    // Re-query: the motion mock remounts the subtree, detaching the old node.
    expect(
      within(nav()).getByRole("link", { name: "Projects" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("moves the active pill onto the clicked item", () => {
    renderHeader();
    const pill = screen.getByTestId("active-pill");
    // "Home" is active on mount, so the pill is already placed.
    expect(pill).toHaveStyle({ opacity: "1" });

    fireEvent.click(within(nav()).getByRole("link", { name: "Contact" }));

    const active = nav().querySelector('[data-active="true"]');
    expect(active).toHaveTextContent("Contact");
    expect(screen.getByTestId("active-pill")).toHaveStyle({ opacity: "1" });
  });
});

describe("Project card", () => {
  it("renders both action links when the project has them", () => {
    render(
      <Project
        title="Both"
        description="Has both links."
        tags={["Python"]}
        liveUrl="https://example.dev"
        githubUrl="https://github.com/x/y"
      />,
    );
    expect(
      screen.getByRole("link", { name: /open both/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /both source code/i }),
    ).toBeInTheDocument();
  });

  it("renders the card body but no action buttons when it has neither", () => {
    render(
      <Project title="Solo" description="No links here." tags={["Bash"]} />,
    );
    expect(screen.getByRole("heading", { name: "Solo" })).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows the logo when one is configured", () => {
    render(
      <Project
        title="Logo'd"
        description="Has a logo."
        tags={["SDK"]}
        logo="/example-logo.svg"
      />,
    );
    expect(screen.getByAltText("Logo'd logo")).toHaveAttribute(
      "src",
      "/example-logo.svg",
    );
  });
});

describe("ContactFormEmail template", () => {
  it("builds an element tree from the message and sender", () => {
    expect(
      ContactFormEmail({ message: "Hello there", senderEmail: "a@b.com" }),
    ).toBeTruthy();
  });
});
