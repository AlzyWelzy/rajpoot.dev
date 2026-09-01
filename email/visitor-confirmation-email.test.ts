import { describe, expect, it } from "vitest";

import visitorConfirmationEmail from "./visitor-confirmation-email";

describe("visitorConfirmationEmail", () => {
  it("renders both the HTML and plaintext parts", () => {
    const { html, text } = visitorConfirmationEmail({
      message: "Hello there",
      senderName: "Test User",
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Hello there");
    expect(html).toContain("Thanks for reaching out");

    expect(text).toContain("Hello there");
    expect(text).toContain("Your message:");
    expect(text).toContain(
      "If you need to add anything, feel free to reply directly to this email.",
    );
    expect(text).toContain("Test User");
    expect(text).toContain("As an experienced backend developer");
    // The plaintext alternative must stay free of markup, or clients that
    // prefer it will show tags to the reader.
    expect(text).not.toContain("<");
  });

  it("escapes HTML metacharacters in the message and the sender", () => {
    const { html } = visitorConfirmationEmail({
      message: "</p><script>alert('xss')</script>",
      senderName: '"><b>Test User',
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    // Single quotes too — an unescaped one breaks out of a single-quoted
    // attribute value just as a double quote breaks out of a double-quoted one.
    expect(html).toContain("alert(&#39;xss&#39;)");
    expect(html).toContain("&quot;&gt;&lt;b&gt;Test User");
    // Ampersands are escaped first, so an escape sequence can't be smuggled in
    // by submitting its literal text.
    expect(
      visitorConfirmationEmail({
        message: "&lt;",
        senderName: "Test User",
      }).html,
    ).toContain("&amp;lt;");
  });

  it("preserves line breaks from a multi-line message", () => {
    const { html, text } = visitorConfirmationEmail({
      message: "line one\nline two",
      senderName: "Test User",
    });

    expect(html).toContain("line one<br />line two");
    expect(text).toContain("line one\nline two");
  });

  it("includes the visitor's email in the greeting", () => {
    const { html, text } = visitorConfirmationEmail({
      message: "hello",
      senderName: "Test User",
    });

    expect(html).toContain("Test User");
    expect(text).toContain("Hi Test User");
  });
});
