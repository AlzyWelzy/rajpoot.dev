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
  senderName: string;
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
  body: "margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;color:#374151;line-height:1.6;-webkit-font-smoothing:antialiased;",
  container: "max-width:600px;margin:0 auto;padding:40px 20px;",
  header: "text-align:center;padding-bottom:30px;",
  headerTitle:
    "font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.5px;margin:0;",
  card: "background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:40px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);",
  heading:
    "margin:0 0 24px;font-size:20px;line-height:1.4;font-weight:600;color:#111827;letter-spacing:-0.3px;",
  text: "margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;",
  quoteBlock:
    "background-color:#f3f4f6;border-left:4px solid #d1d5db;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0;",
  quoteText:
    "margin:0;font-size:15px;line-height:1.6;color:#4b5563;font-style:italic;white-space:pre-wrap;",
  muted:
    "margin:0 0 8px 0;font-size:11px;line-height:1.5;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;",
  footer: "text-align:center;padding-top:32px;",
  footerText: "margin:0 0 4px 0;font-size:12px;color:#9ca3af;",
  link: "color:#6b7280;text-decoration:underline;",
} as const;

export default function visitorConfirmationEmail({
  message,
  senderName,
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
      <div style="${styles.header}">
        <h1 style="${styles.headerTitle}">Manvendra Rajpoot</h1>
      </div>
      <div style="${styles.card}">
        <h2 style="${styles.heading}">${escapeHtml(heading)}</h2>
        <p style="${styles.text}">Hi${senderName ? " " + escapeHtml(senderName) : ""},</p>
        <p style="${styles.text}">Thank you for reaching out. I appreciate you taking the time to get in touch.</p>
        <p style="${styles.text}">As an experienced backend developer, I specialize in designing and scaling robust, secure, and highly performant backend systems. I have architected multi-tenant SaaS platforms, built AI-powered automation tools, and implemented complex API integrations from the ground up using Python, Django, Node.js, and PostgreSQL.</p>
        <p style="${styles.text}">My focus is always on delivering reliable, maintainable code that directly solves business needs&mdash;whether that means implementing multi-factor authentication, optimizing database performance, or setting up seamless CI/CD pipelines.</p>
        <p style="${styles.text}">I have attached my resume to this email so you can get a more comprehensive look at my background, technical skills, and the impact I&#39;ve driven in my previous roles.</p>
        <p style="${styles.text}">I will review your message shortly and get back to you as soon as I can. I look forward to the possibility of collaborating with you.</p>
        
        <div style="${styles.quoteBlock}">
          <p style="${styles.muted}">Your message:</p>
          <p style="${styles.quoteText}">${escapeParagraph(message)}</p>
        </div>
        
        <p style="${styles.text}">If you need to add anything, feel free to reply directly to this email.</p>
        <p style="${styles.text}">Best regards,<br/><strong style="color:#111827;font-weight:600;">Manvendra Rajpoot</strong></p>
      </div>
      <div style="${styles.footer}">
        <p style="${styles.footerText}">&copy; ${new Date().getFullYear()} Manvendra Rajpoot. All rights reserved.</p>
        <p style="${styles.footerText}"><a href="https://www.rajpoot.dev" style="${styles.link}">www.rajpoot.dev</a></p>
      </div>
    </div>
  </body>
</html>`;

  const text = [
    heading,
    "",
    `Hi ${senderName},`,
    "",
    "Thank you for reaching out. I appreciate you taking the time to get in touch.",
    "",
    "As an experienced backend developer, I specialize in designing and scaling robust, secure, and highly performant backend systems. I have architected multi-tenant SaaS platforms, built AI-powered automation tools, and implemented complex API integrations from the ground up using Python, Django, Node.js, and PostgreSQL.",
    "",
    "My focus is always on delivering reliable, maintainable code that directly solves business needs—whether that means implementing multi-factor authentication, optimizing database performance, or setting up seamless CI/CD pipelines.",
    "",
    "I have attached my resume to this email so you can get a more comprehensive look at my background, technical skills, and the impact I've driven in my previous roles.",
    "",
    "I will review your message shortly and get back to you as soon as I can. I look forward to the possibility of collaborating with you.",
    "",
    "---",
    "Your message:",
    "",
    message,
    "",
    "---",
    "If you need to add anything, feel free to reply directly to this email.",
    "Best regards,",
    "Manvendra Rajpoot",
  ].join("\n");

  return { html, text };
}
