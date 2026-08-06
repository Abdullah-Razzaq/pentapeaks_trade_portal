import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(to: string, code: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: "Your Pentapeaks Portal Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Pentapeaks Trade Portal</h2>
        <p style="color: #555; font-size: 16px;">Hello,</p>
        <p style="color: #555; font-size: 16px;">Thank you for registering. Please use the verification code below to activate your account. This code is valid for 15 minutes.</p>
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #eee; margin: 30px 0;">
          <h1 style="font-size: 32px; letter-spacing: 4px; color: #f97316; margin: 0;">${code}</h1>
        </div>
        <p style="color: #999; font-size: 14px; text-align: center;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(to: string, code: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: "Reset Your Pentapeaks Portal Password",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Pentapeaks Trade Portal</h2>
        <p style="color: #555; font-size: 16px;">Hello,</p>
        <p style="color: #555; font-size: 16px;">We received a request to reset your password. Please use the OTP code below to set a new password. This code is valid for 15 minutes.</p>
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #eee; margin: 30px 0;">
          <h1 style="font-size: 32px; letter-spacing: 4px; color: #f97316; margin: 0;">${code}</h1>
        </div>
        <p style="color: #999; font-size: 14px; text-align: center;">If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
