import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const defaultFrom = process.env.EMAIL_FROM || "Pentapeaks Trade Portal <noreply@trade.pentapeaks.com>";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendVerificationEmail(to: string, code: string) {
  const verificationLink = `${appUrl}/api/auth/verify?token=${code}&email=${encodeURIComponent(to)}`;
  
  try {
    await resend.emails.send({
      from: defaultFrom,
      to,
      subject: "Verify Your Pentapeaks Portal Account",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Pentapeaks Trade Portal</h2>
          <p style="color: #555; font-size: 16px;">Hello,</p>
          <p style="color: #555; font-size: 16px;">Thank you for registering. Please click the button below to verify your email and activate your account. This link is valid for 15 minutes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #f97316; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 12px; text-align: center; word-break: break-all;">${verificationLink}</p>
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 20px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Resend Error:", error);
  }
}

export async function sendPasswordResetEmail(to: string, code: string) {
  const resetLink = `${appUrl}/reset-password?token=${code}&email=${encodeURIComponent(to)}`;

  try {
    await resend.emails.send({
      from: defaultFrom,
      to,
      subject: "Reset Your Pentapeaks Portal Password",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Pentapeaks Trade Portal</h2>
          <p style="color: #555; font-size: 16px;">Hello,</p>
          <p style="color: #555; font-size: 16px;">We received a request to reset your password. Please click the button below to set a new password. This link is valid for 15 minutes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #f97316; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 12px; text-align: center; word-break: break-all;">${resetLink}</p>
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 20px;">If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Resend Error:", error);
  }
}
