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
  senderName: string;
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
  body: "margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;color:#374151;line-height:1.6;-webkit-font-smoothing:antialiased;",
  container: "max-width:600px;margin:0 auto;padding:40px 20px;",
  header: "text-align:center;padding-bottom:30px;",
  headerTitle:
    "font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.5px;margin:0;",
  card: "background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:40px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);",
  heading:
    "margin:0 0 24px;font-size:20px;line-height:1.4;font-weight:600;color:#111827;letter-spacing:-0.3px;",
  quoteBlock:
    "background-color:#f3f4f6;border-left:4px solid #d1d5db;padding:16px 20px;margin:0 0 32px 0;border-radius:0 8px 8px 0;",
  quoteText:
    "margin:0;font-size:15px;line-height:1.6;color:#4b5563;white-space:pre-wrap;",
  hr: "border:none;border-top:1px solid #e5e7eb;margin:0 0 24px 0;",
  table: "width:100%;border-collapse:collapse;",
  tdLabel:
    "padding:12px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-weight:600;font-size:14px;width:100px;",
  tdValue:
    "padding:12px 0;border-bottom:1px solid #e5e7eb;color:#4b5563;font-size:14px;text-align:right;",
  tdLabelLast:
    "padding:12px 0 0 0;color:#111827;font-weight:600;font-size:14px;width:100px;",
  tdValueLast:
    "padding:12px 0 0 0;color:#4b5563;font-size:14px;text-align:right;",
  link: "color:#2563eb;text-decoration:none;",
} as const;

export default function contactFormEmail({
  message,
  senderEmail,
  senderName,
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
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">New message from ${escapeHtml(senderName)}</div>
    <div style="${styles.container}">
      <div style="${styles.header}">
        <h1 style="${styles.headerTitle}">Rajpoot.dev</h1>
      </div>
      <div style="${styles.card}">
        <h2 style="${styles.heading}">${escapeHtml(heading)}</h2>
        
        <div style="${styles.quoteBlock}">
          <p style="${styles.quoteText}">${escapeParagraph(message)}</p>
        </div>
        
        <hr style="${styles.hr}" />
        
        <table style="${styles.table}">
          <tr>
            <td style="${styles.tdLabel}">Name</td>
            <td style="${styles.tdValue}">${escapeHtml(senderName)}</td>
          </tr>
          <tr>
            <td style="${styles.tdLabelLast}">Email</td>
            <td style="${styles.tdValueLast}">
              <a href="mailto:${escapeHtml(senderEmail)}" style="${styles.link}">${escapeHtml(senderEmail)}</a>
            </td>
          </tr>
        </table>
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
    `The sender's name is: ${senderName}`,
    `The sender's email is: ${senderEmail}`,
  ].join("\n");

  return { html, text };
}
