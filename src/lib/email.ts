import { Resend } from "resend";
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
