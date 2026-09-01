/**
 * The visitor confirmation email, built as a plain HTML string plus a
 * plaintext alternative.
 *
 * Sent to the visitor after a successful contact-form submission so they
 * have a receipt of their message and know it was delivered. The caller
 * sets `replyTo` to the owner's Zoho mailbox (manvendra@rajpoot.dev) so
 * any reply reaches a real inbox — the `from` address (hello@rajpoot.dev)
 * is a Resend-only sender with no mailbox behind it.
 *
 * Architecture mirrors `contact-form-email.ts`: dependency-free string
 * builder, `escapeHtml` on every untrusted interpolation, and both an
 * HTML and a `text/plain` part for spam-filter scoring.
 */

export type VisitorConfirmationEmailProps = {
  message: string;
  senderEmail: string;
};

export type VisitorConfirmationEmailContent = {
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

/** Escape, then turn newlines into <br> so a multi-line message keeps shape. */
function escapeParagraph(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

// Inline styles only: <style> blocks and external stylesheets are stripped or
// ignored by most mail clients (Gmail drops <head> entirely on forwards).
const styles = {
  body: "margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;",
  container: "max-width:600px;margin:0 auto;padding:24px 12px;",
  card: "background-color:#ffffff;border:1px solid rgba(0,0,0,0.1);border-radius:6px;padding:16px 40px;",
  heading:
    "margin:16px 0;font-size:20px;line-height:1.3;font-weight:600;color:#111827;",
  text: "margin:16px 0;font-size:14px;line-height:1.6;color:#111827;",
  hr: "border:none;border-top:1px solid rgba(0,0,0,0.1);margin:24px 0;",
  muted: "margin:16px 0;font-size:13px;line-height:1.6;color:#4b5563;",
} as const;

export default function visitorConfirmationEmail({
  message,
  senderEmail,
}: VisitorConfirmationEmailProps): VisitorConfirmationEmailContent {
  const heading = "Thanks for reaching out!";

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="${styles.body}">
    <!-- Preview text: what inbox lists show next to the subject. Hidden in the
         body itself by zero sizing, which is the portable way to do it. -->
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">Your message has been received</div>
    <div style="${styles.container}">
      <div style="${styles.card}">
        <h1 style="${styles.heading}">${escapeHtml(heading)}</h1>
        <p style="${styles.text}">Hi${senderEmail ? " " + escapeHtml(senderEmail) : ""},</p>
        <p style="${styles.text}">Thank you for getting in touch. I&#39;ve received your message and will get back to you as soon as possible.</p>
        <hr style="${styles.hr}" />
        <p style="${styles.muted}">Here&#39;s a copy of what you sent:</p>
        <p style="${styles.text}">${escapeParagraph(message)}</p>
        <hr style="${styles.hr}" />
        <p style="${styles.muted}">You can reply directly to this email if you need to add anything.</p>
      </div>
    </div>
  </body>
</html>`;

  const text = [
    heading,
    "",
    `Hi ${senderEmail},`,
    "",
    "Thank you for getting in touch. I've received your message and will get back to you as soon as possible.",
    "",
    "---",
    "Here's a copy of what you sent:",
    "",
    message,
    "",
    "---",
    "You can reply directly to this email if you need to add anything.",
  ].join("\n");

  return { html, text };
}
