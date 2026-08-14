# ESUT Marketplace Email Notifications

## Verified Preview

The ESUT Marketplace preview is running. The administrator notification panel is available at `/admin/settings/notifications` for an authenticated `ADMIN` or `SUPER_ADMIN`. It currently exposes the provider selector, event preferences, seller-approval template editor, safe placeholder preview, and save actions.

The live Resend test was accepted for delivery to the permitted account-owner email, with message ID `7ce30922-3ee4-4616-942f-69cb2d150025`.

## Provider Adapter Contract

All marketplace workflows call one server-side function, preventing provider details and credentials from leaking into browser code.

```ts
export type NotificationProvider = "RESEND" | "SENDGRID" | "SMTP" | "DISABLED";

export type TransactionalEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendTransactionalEmail(email: TransactionalEmail) {
  const provider = await configuredProvider();
  if (provider === "DISABLED") return { provider, delivered: false };

  if (provider === "SENDGRID" || provider === "SMTP") {
    console.warn(`[Notifications] ${provider} is selected but no adapter has been installed yet.`);
    return { provider, delivered: false };
  }

  // Resend implementation lives here; credentials remain server-only.
}
```

The existing **SendGrid** and **SMTP** entries are safe stubs. Selecting either deliberately stops external email delivery and logs that an adapter is missing; the platform never pretends the email was sent.

## Implementing SendGrid

First add `SENDGRID_API_KEY` through the project secrets interface. Then replace the SendGrid stub with an adapter using the same `TransactionalEmail` contract.

```ts
if (provider === "SENDGRID") {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.sendGridApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: email.to }] }],
      from: { email: ENV.sendGridFromEmail },
      subject: email.subject,
      content: [
        { type: "text/plain", value: email.text },
        { type: "text/html", value: email.html ?? `<p>${escapeHtml(email.text)}</p>` },
      ],
    }),
  });
  return { provider, delivered: response.ok };
}
```

## Implementing SMTP

First add SMTP host, port, username, password, and verified sender values as server-only secrets. Install a production email transport package such as `nodemailer`, then add an SMTP adapter under the same conditional block.

```ts
if (provider === "SMTP") {
  const transport = nodemailer.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpPort === 465,
    auth: { user: ENV.smtpUser, pass: ENV.smtpPassword },
  });
  await transport.sendMail({
    from: ENV.smtpFromEmail,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
  return { provider, delivered: true };
}
```

## Customizing Templates

An administrator can edit the seller-approval subject and body under **Administrator → Notification channels**. The current editor stores templates in `marketplaceSettings` under `email_templates` and previews values safely before saving.

| Placeholder | Rendered value |
| --- | --- |
| `{{name}}` | Recipient display name |
| `{{storeName}}` | Approved store name |
| `{{dashboardUrl}}` | Seller dashboard route |
| `{{orderId}}` | Public marketplace order ID |
| `{{total}}` | Final server-calculated order total |
| `{{orderStatus}}` | Controlled order status |

The server renders persisted templates with `renderManagedEmailTemplate()` before it sends the seller-approval email. This means template changes affect subsequent deliveries, not previously sent emails.

## Adding a Notification Event

To add an event such as `offer_accepted`, use the following sequence. First add the template key and default content in `server/notifications.ts`. Then add the allowed placeholders to the interpolation expression. Next, invoke the renderer and provider-neutral sender after the authorized business-state change. Finally, add a database-backed event preference, administrator form control, and Vitest coverage for the rendering and state transition.

```ts
// 1. Add a typed key and default template.
export type EmailTemplateKey =
  | "seller_application_approved"
  | "offer_accepted";

// 2. After the server accepts an offer, render and send.
const template = await renderManagedEmailTemplate("offer_accepted", {
  name: buyer.name ?? "there",
  orderId: offer.id.toString(),
});

await sendTransactionalEmail({
  to: buyer.email,
  subject: template.subject,
  text: template.body,
});
```

Never send email directly from a browser component, accept provider names or credentials from a client request, or announce delivery when an adapter returns `delivered: false`.
