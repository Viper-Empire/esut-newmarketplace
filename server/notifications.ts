import { ENV } from "./_core/env";
import { eq } from "drizzle-orm";
import { marketplaceSettings } from "../drizzle/schema";
import { getDb } from "./db";

export type NotificationProvider = "RESEND" | "DISABLED";
export type TransactionalEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type NotificationChannelSettings = { provider: NotificationProvider; orderUpdates: boolean; sellerApplications: boolean; offerUpdates: boolean; reviews: boolean };
export type TransactionalEmailEvent = "orderUpdates" | "sellerApplications" | "offerUpdates" | "reviews";

export type EmailTemplateKey = "seller_application_approved" | "seller_application_rejected" | "order_created" | "order_status_updated";
export type ManagedEmailTemplate = { subject: string; body: string };
const defaultTemplates: Record<EmailTemplateKey, ManagedEmailTemplate> = {
  seller_application_approved: { subject: "Your ESUT Marketplace seller application was approved", body: "Hello {{name}},\n\nYour seller application has been approved. Your store, {{storeName}}, is now active on ESUT Marketplace.\n\nVisit {{dashboardUrl}} to begin managing your store." },
  seller_application_rejected: { subject: "An update on your ESUT Marketplace seller application", body: "Hello {{name}},\n\nYour seller application was not approved at this time. Please review the administrator note in your application." },
  order_created: { subject: "Your ESUT Marketplace order {{orderId}} was created", body: "Hello {{name}},\n\nYour order {{orderId}} has been created for campus pickup. Total: {{total}}." },
  order_status_updated: { subject: "Your ESUT Marketplace order {{orderId}} was updated", body: "Hello {{name}},\n\nYour order status is now {{orderStatus}}." },
};

async function configuredNotificationSettings(): Promise<NotificationChannelSettings> {
  const db = await getDb();
  const fallback: NotificationChannelSettings = { provider: ENV.resendApiKey && ENV.resendFromEmail ? "RESEND" : "DISABLED", orderUpdates: true, sellerApplications: true, offerUpdates: true, reviews: true };
  if (!db) return fallback;
  const rows = await db.select({ value: marketplaceSettings.value }).from(marketplaceSettings).where(eq(marketplaceSettings.settingKey, "notification_channels")).limit(1);
  const settings = rows[0]?.value as Partial<NotificationChannelSettings> | undefined;
  return { ...fallback, ...settings, provider: settings?.provider === "RESEND" ? "RESEND" : settings?.provider === "DISABLED" ? "DISABLED" : fallback.provider };
}

export async function renderManagedEmailTemplate(key: EmailTemplateKey, values: Record<string, string>): Promise<ManagedEmailTemplate> {
  const db = await getDb();
  const rows = db ? await db.select({ value: marketplaceSettings.value }).from(marketplaceSettings).where(eq(marketplaceSettings.settingKey, "email_templates")).limit(1) : [];
  const templates = rows[0]?.value as Partial<Record<EmailTemplateKey, ManagedEmailTemplate>> | undefined;
  const template = templates?.[key] ?? defaultTemplates[key];
  const interpolate = (value: string) => value.replace(/{{(name|storeName|dashboardUrl|orderId|total|orderStatus)}}/g, (_match, variable) => values[variable] ?? "");
  return { subject: interpolate(template.subject), body: interpolate(template.body) };
}

/**
 * Email delivery is intentionally isolated from marketplace workflows. A future provider
 * only needs to implement this contract and be selected in marketplace settings.
 */
export async function sendTransactionalEmail(email: TransactionalEmail, event?: TransactionalEmailEvent): Promise<{ provider: NotificationProvider; delivered: boolean; suppressed?: boolean }> {
  const settings = await configuredNotificationSettings();
  const provider = settings.provider;
  if (event && !settings[event]) return { provider, delivered: false, suppressed: true };
  if (provider === "DISABLED") return { provider, delivered: false };
  if (!ENV.resendApiKey || !ENV.resendFromEmail) return { provider, delivered: false };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: ENV.resendFromEmail,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      html: email.html ?? `<p>${escapeHtml(email.text).replaceAll("\n", "<br/>")}</p>`,
    }),
  });

  if (!response.ok) {
    console.error("[Notifications] Resend delivery failed", response.status, await response.text());
    return { provider, delivered: false };
  }
  return { provider, delivered: true };
}

const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
