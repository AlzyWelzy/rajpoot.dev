/**
 * The contact-form notification email, built as a plain HTML string plus a
 * plaintext alternative.
 *
 * This used to be a React component rendered through `react-email`. That was a
 * whole rendering runtime (and, historically, the html-to-text / prismjs
 * resolution problems documented in next.config.mjs) in service of one static
 * template that has never needed a component tree. A string builder has no
 * dependencies, and shipping a real `text/plain` part alongside the HTML —
 * which the React path did not produce — is what spam filters actually want to
 * see on a transactional message.
 *
 * Both values are interpolated from untrusted form input, so every one of them
 * goes through `escapeHtml` on the HTML side. React did that implicitly; here
 * it is explicit and must stay that way.
 */

export type ContactFormEmailProps = {
  message: string;
  senderEmail: string;
};

export type ContactFormEmailContent = {
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

export default function contactFormEmail({
  message,
  senderEmail,
}: ContactFormEmailProps): ContactFormEmailContent {
  const heading = "You received the following message from the contact form";

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
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">New message from your portfolio site</div>
    <div style="${styles.container}">
      <div style="${styles.card}">
        <h1 style="${styles.heading}">${escapeHtml(heading)}</h1>
        <p style="${styles.text}">${escapeParagraph(message)}</p>
        <hr style="${styles.hr}" />
        <p style="${styles.muted}">The sender&#39;s email is: ${escapeHtml(senderEmail)}</p>
      </div>
    </div>
  </body>
</html>`;

  const text = [
    heading,
    "",
    message,
    "",
    "---",
    `The sender's email is: ${senderEmail}`,
  ].join("\n");

  return { html, text };
}
