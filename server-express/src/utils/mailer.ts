import nodemailer from "nodemailer";

export const sendOTPEmail = async (email: string, otp: string, name: string) => {
  // Always log the OTP to the console for easy local development / testing
  console.log("\n" + "=".repeat(60));
  console.log("               [OTP VERIFICATION CODE]");
  console.log(`   User:     ${name}`);
  console.log(`   Email:    ${email}`);
  console.log(`   Code:     ${otp}`);
  console.log("   Expires:  In 10 minutes");
  console.log("=".repeat(60) + "\n");

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // If SMTP is not configured, skip sending the actual email but succeed
  if (!host || !user || !pass) {
    console.log(`[Mailer] SMTP not configured. OTP printed to console.`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from: `"DevPilot Support" <${user}>`,
      to: email,
      subject: `Verify Your DevPilot Account - OTP Code: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #2563EB; text-align: center;">DevPilot Email Verification</h2>
          <p>Hi ${name},</p>
          <p>Thank you for registering on DevPilot. To complete your registration and secure your account, please verify your email address using the One-Time Password (OTP) below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827; background-color: #f3f4f6; padding: 12px 24px; border-radius: 6px; border: 1px dashed #2563EB;">
              ${otp}
            </span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>. If you did not request this verification, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">DevPilot - Unified Engineering Career Platform</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] OTP email sent successfully to ${email}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`[Mailer] Failed to send OTP email to ${email}:`, error);
  }
};
