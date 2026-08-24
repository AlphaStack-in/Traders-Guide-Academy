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
