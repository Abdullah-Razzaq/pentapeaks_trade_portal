import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const defaultFrom = process.env.EMAIL_FROM || "Pentapeaks Trade Portal <noreply@trade.pentapeaks.com>";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendVerificationEmail(to: string, code: string, baseUrl: string) {
  const [extractedCode] = code.split("_");
  
  try {
    await resend.emails.send({
      from: defaultFrom,
      to,
      subject: "Verify Your Pentapeaks Portal Account",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Pentapeaks Trade Portal</h2>
          <p style="color: #555; font-size: 16px;">Hello,</p>
          <p style="color: #555; font-size: 16px;">Thank you for registering. Please enter the 6-digit verification code below to activate your account. This code is valid for 24 hours.</p>
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #f97316; margin: 20px 0;">${extractedCode}</p>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 20px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Resend Error:", error);
  }
}

export async function sendPasswordResetEmail(to: string, code: string, baseUrl: string) {
  try {
    await resend.emails.send({
      from: defaultFrom,
      to,
      subject: "Reset Your Pentapeaks Portal Password",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Pentapeaks Trade Portal</h2>
          <p style="color: #555; font-size: 16px;">Hello,</p>
          <p style="color: #555; font-size: 16px;">We received a request to reset your password. Please enter the 6-digit verification code below to reset your password. This code is valid for 15 minutes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #f97316; margin: 20px 0;">${code}</p>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 20px;">If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Resend Error:", error);
  }
}
