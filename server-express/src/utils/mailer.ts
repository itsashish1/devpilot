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

  const awsHost = process.env.AWS_SMTP_HOST;
  const awsPort = process.env.AWS_SMTP_PORT ? parseInt(process.env.AWS_SMTP_PORT) : 587;
  const awsUser = process.env.AWS_SMTP_USER;
  const awsPass = process.env.AWS_SMTP_PASS;

  const gmailHost = process.env.GMAIL_SMTP_HOST;
  const gmailPort = process.env.GMAIL_SMTP_PORT ? parseInt(process.env.GMAIL_SMTP_PORT) : 587;
  const gmailUser = process.env.GMAIL_SMTP_USER;
  const gmailPass = process.env.GMAIL_SMTP_PASS;

  const mailOptions = {
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

  // Helper function to send email
  const attemptSend = async (host: string, port: number, user: string, pass: string, providerName: string) => {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    
    // Resend verified custom domain
    const fromEmail = host.includes("resend") ? "support@itsmeashishy.live" : user;
    
    const info = await transporter.sendMail({ ...mailOptions, from: `"DevPilot Support" <${fromEmail}>` });
    console.log(`[Mailer] OTP email sent successfully via ${providerName} to ${email}. Message ID: ${info.messageId}`);
    return info;
  };

  // 1. Try AWS SES (Primary)
  if (awsHost && awsUser && awsPass && !awsUser.includes("your_aws_ses_user")) {
    try {
      await attemptSend(awsHost, awsPort, awsUser, awsPass, "AWS SES");
      return; // Success, exit function
    } catch (error) {
      console.warn(`[Mailer] AWS SES failed. Falling back to Gmail... Error: ${(error as Error).message}`);
    }
  } else {
    console.log(`[Mailer] AWS SES not configured. Skipping primary provider...`);
  }

  // 2. Try Gmail (Secondary/Fallback)
  if (gmailHost && gmailUser && gmailPass && !gmailUser.includes("your_gmail_username")) {
    try {
      await attemptSend(gmailHost, gmailPort, gmailUser, gmailPass, "Gmail");
      return; // Success
    } catch (error) {
      console.error(`[Mailer] Gmail fallback failed:`, error);
    }
  } else {
    console.log(`[Mailer] Gmail not configured. Skipping fallback provider...`);
  }

  console.log(`[Mailer] Could not send OTP email. Both providers failed or are unconfigured.`);
};
