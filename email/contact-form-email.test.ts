import { describe, expect, it } from "vitest";

import contactFormEmail from "./contact-form-email";

describe("contactFormEmail", () => {
  it("renders both the HTML and plaintext parts", () => {
    const { html, text } = contactFormEmail({
      message: "Hello there",
      senderEmail: "a@b.com",
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Hello there");
    expect(html).toContain("a@b.com");

    expect(text).toContain("Hello there");
    expect(text).toContain("The sender's email is: a@b.com");
    // The plaintext alternative must stay free of markup, or clients that
    // prefer it will show tags to the reader.
    expect(text).not.toContain("<");
  });

  it("escapes HTML metacharacters in the message and the sender", () => {
    const { html } = contactFormEmail({
      message: "</p><script>alert('xss')</script>",
      senderEmail: '"><b>a@b.com',
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    // Single quotes too — an unescaped one breaks out of a single-quoted
    // attribute value just as a double quote breaks out of a double-quoted one.
    expect(html).toContain("alert(&#39;xss&#39;)");
    expect(html).toContain("&quot;&gt;&lt;b&gt;a@b.com");
    // Ampersands are escaped first, so an escape sequence can't be smuggled in
    // by submitting its literal text.
    expect(
      contactFormEmail({ message: "&lt;", senderEmail: "a@b.com" }).html,
    ).toContain("&amp;lt;");
  });

  it("preserves line breaks from a multi-line message", () => {
    const { html, text } = contactFormEmail({
      message: "line one\nline two",
      senderEmail: "a@b.com",
    });

    expect(html).toContain("line one<br />line two");
    expect(text).toContain("line one\nline two");
  });
});
