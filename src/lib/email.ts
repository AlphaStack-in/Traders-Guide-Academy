import { Resend } from "resend";
import nodemailer from "nodemailer";
import { clientConfig } from "@/lib/client-config";

// Shared Resend client -- returns null when RESEND_API_KEY is unset,
// triggering dev-simulation (console logging) in callers.
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

// Shared from-address used by all outgoing emails.
export function getFromAddress(): string {
  return (
    process.env.EMAIL_FROM_ADDRESS ||
    `${clientConfig.siteName} <noreply@tga-placeholder.app>`
  );
}

export interface SendReferralInviteParams {
  toEmail: string;
  memberName: string;
  inviteUrl: string;
}

export async function sendReferralInviteEmail({
  toEmail,
  memberName,
  inviteUrl,
}: SendReferralInviteParams): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();

  if (!resend) {
    console.log(`[Dev Email Simulation] Referral invitation sent to ${toEmail} for ${memberName}`);
    console.log(`[Dev Email Simulation] Invite URL: ${inviteUrl}`);
    return { success: true };
  }

  try {
    const fromAddress = getFromAddress();

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: `You're Invited to Join ${clientConfig.siteName} Premium`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0B0B0D; color: #F3F4F6; padding: 32px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
          <h2 style="color: #F0C949; margin-top: 0;">Welcome to ${clientConfig.siteName}</h2>
          <p>Hello ${memberName},</p>
          <p>You have been invited to join <strong>${clientConfig.siteName} Premium</strong> — transparent, unedited intraday options signals and analytics.</p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${inviteUrl}" style="background: linear-gradient(135deg, #D4AF37 0%, #F0C949 100%); color: #0B0B0D; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">
              Accept Referral & Register
            </a>
          </div>
          <p style="font-size: 12px; color: #9CA3AF;">If the button above does not work, copy and paste this link into your browser:<br/><a href="${inviteUrl}" style="color: #F0C949;">${inviteUrl}</a></p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send invitation email.";
    console.error("Error sending email:", err);
    return { success: false, error: message };
  }
}

export interface SendAnnouncementEmailParams {
  toEmail: string;
  memberName: string;
  subject: string;
  message: string;
}

/**
 * Admin -> members broadcast email (the "Announcement" panel in the admin
 * Subscribers table — see subscribers-table.tsx). Deliberately a separate
 * channel from sendReferralInviteEmail and the weekly digest: it is not
 * gated by Subscriber.emailDigestOptOut, since that flag only covers the
 * automated performance digest, not one-off admin messages an admin
 * explicitly chose to send to this member.
 */
export async function sendAnnouncementEmail({
  toEmail,
  memberName,
  subject,
  message,
}: SendAnnouncementEmailParams): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();

  if (!resend) {
    console.log(`[Dev Email Simulation] Announcement "${subject}" sent to ${toEmail} (${memberName})`);
    console.log(`[Dev Email Simulation] Body: ${message}`);
    return { success: true };
  }

  try {
    const fromAddress = getFromAddress();

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0B0B0D; color: #F3F4F6; padding: 32px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
          <h2 style="color: #F0C949; margin-top: 0;">${clientConfig.siteName}</h2>
          <p>Hello ${memberName},</p>
          <p style="white-space: pre-line;">${message}</p>
          <p style="font-size: 12px; color: #9CA3AF; margin-top: 32px;">You're receiving this because you're a registered member of ${clientConfig.siteName}.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error (announcement):", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to send announcement email.";
    console.error("Error sending announcement email:", err);
    return { success: false, error: errorMessage };
  }
}

export interface SendContactReplyEmailParams {
  toEmail: string;
  memberName: string;
  originalMessage: string;
  replyText: string;
}

/**
 * Admin -> contact-form-submitter reply email, triggered from the "Reply"
 * action on the admin Messages table (messages-table.tsx / replyToMessage).
 * ContactMessage.email is optional (only phone is required on the public
 * contact form), so callers must check for an email on file before calling
 * this — when there isn't one, the admin's reply is logged internally only
 * and the admin is expected to follow up via WhatsApp/phone instead.
 */
export async function sendContactReplyEmail({
  toEmail,
  memberName,
  originalMessage,
  replyText,
}: SendContactReplyEmailParams): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();

  if (!resend) {
    console.log(`[Dev Email Simulation] Contact reply sent to ${toEmail} (${memberName})`);
    console.log(`[Dev Email Simulation] Reply: ${replyText}`);
    return { success: true };
  }

  try {
    const fromAddress = getFromAddress();

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: `Re: Your message to ${clientConfig.siteName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0B0B0D; color: #F3F4F6; padding: 32px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
          <h2 style="color: #F0C949; margin-top: 0;">${clientConfig.siteName}</h2>
          <p>Hello ${memberName},</p>
          <p style="white-space: pre-line;">${replyText}</p>
          <div style="margin-top: 24px; padding: 16px; border-left: 2px solid rgba(255,255,255,0.15); color: #9CA3AF; font-size: 13px;">
            <p style="margin: 0 0 4px;">Your original message:</p>
            <p style="margin: 0; white-space: pre-line;">${originalMessage}</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error (contact reply):", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to send reply email.";
    console.error("Error sending contact reply email:", err);
    return { success: false, error: errorMessage };
  }
}

// SMTP transport for the info@alphastack.in mailbox (hosting-provider email,
// not Resend) -- used only for the admin alert emails below. Returns null
// when unconfigured, triggering dev-simulation (console logging) in callers.
function getAdminMailboxTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !port || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });
}

/**
 * Admin-facing "someone submitted X" alert, shared by the contact form and
 * the referral form (see sendContactMessageAdminAlert / sendReferralAdminAlert
 * below). Recipient is ADMIN_EMAIL (the same single admin account used for
 * admin login). Sent via SMTP from the info@alphastack.in mailbox directly
 * (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD) rather than through Resend,
 * which every other email in this file uses.
 */
async function sendAdminAlertEmail({
  subject,
  html,
}: {
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("ADMIN_EMAIL is not set; cannot send admin alert email.");
    return { success: false, error: "ADMIN_EMAIL is not configured." };
  }

  const transport = getAdminMailboxTransport();

  if (!transport) {
    console.log(`[Dev Email Simulation] Admin alert "${subject}" sent to ${adminEmail}`);
    return { success: true };
  }

  try {
    await transport.sendMail({
      from: `"${clientConfig.siteName}" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject,
      html,
    });

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to send admin alert email.";
    console.error("Error sending admin alert email:", err);
    return { success: false, error: errorMessage };
  }
}

export interface SendContactMessageAdminAlertParams {
  name: string;
  phone: string;
  email: string | null;
  message: string;
}

/** Fired from submitContactMessage (contact/actions.ts) right after the message is saved. */
export async function sendContactMessageAdminAlert({
  name,
  phone,
  email,
  message,
}: SendContactMessageAdminAlertParams): Promise<{ success: boolean; error?: string }> {
  return sendAdminAlertEmail({
    subject: `New contact message from ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0B0B0D; color: #F3F4F6; padding: 32px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
        <h2 style="color: #F0C949; margin-top: 0;">New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email || "Not provided"}</p>
        <div style="margin-top: 16px; padding: 16px; border-left: 2px solid rgba(240,201,73,0.4); white-space: pre-line;">${message}</div>
      </div>
    `,
  });
}

export interface SendReferralAdminAlertParams {
  referrerName: string;
  referrerPhone: string;
  referredName: string;
  referredPhone: string;
}

/** Fired from submitReferral (contact/actions.ts) right after the referral is saved. */
export async function sendReferralAdminAlert({
  referrerName,
  referrerPhone,
  referredName,
  referredPhone,
}: SendReferralAdminAlertParams): Promise<{ success: boolean; error?: string }> {
  return sendAdminAlertEmail({
    subject: `New referral from ${referrerName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0B0B0D; color: #F3F4F6; padding: 32px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
        <h2 style="color: #F0C949; margin-top: 0;">New Referral</h2>
        <p><strong>Referrer:</strong> ${referrerName} (${referrerPhone})</p>
        <p><strong>Referred:</strong> ${referredName} (${referredPhone})</p>
      </div>
    `,
  });
}

export interface SendProductPurchaseEmailParams {
  toEmail: string;
  memberName: string;
  productName: string;
  /** Plain-text/HTML-safe delivery details — e.g. a download link, an
   * indicator file, or PMS/membership onboarding instructions. Rendered
   * with white-space preserved, same convention as the other templates
   * here. */
  deliveryDetails: string;
}

/**
 * Sent automatically once a /products purchase is confirmed (free product
 * claimed immediately, paid product on the Cashfree ORDER_PAID webhook —
 * see src/lib/product-fulfillment.ts). For Indicators/PMS/Membership this
 * is one of two automated channels (this email + an internal Telegram ops
 * alert); a "Continue via WhatsApp" link is also shown to the buyer in the
 * UI, but that link is a manual click-to-chat handoff, not a second
 * automated send — there is no automated WhatsApp Business API integration
 * in this codebase (every other WhatsApp reference here is the same manual
 * wa.me link pattern as continue-premium-panel.tsx).
 */
export async function sendProductPurchaseEmail({
  toEmail,
  memberName,
  productName,
  deliveryDetails,
}: SendProductPurchaseEmailParams): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();

  if (!resend) {
    console.log(`[Dev Email Simulation] Product purchase email sent to ${toEmail} for "${productName}"`);
    console.log(`[Dev Email Simulation] Delivery details: ${deliveryDetails}`);
    return { success: true };
  }

  try {
    const fromAddress = getFromAddress();

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: `Your ${productName} purchase — ${clientConfig.siteName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0B0B0D; color: #F3F4F6; padding: 32px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
          <h2 style="color: #F0C949; margin-top: 0;">Thanks for your purchase, ${memberName}!</h2>
          <p>Your purchase of <strong>${productName}</strong> is confirmed.</p>
          <div style="margin: 24px 0; padding: 16px; border-left: 2px solid rgba(240,201,73,0.4); white-space: pre-line;">${deliveryDetails}</div>
          <p style="font-size: 12px; color: #9CA3AF;">Questions about this order? Reply to this email or reach us on WhatsApp from your account.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error (product purchase):", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to send product purchase email.";
    console.error("Error sending product purchase email:", err);
    return { success: false, error: errorMessage };
  }
}
