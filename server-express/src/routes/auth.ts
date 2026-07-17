import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db";
import { sendOTPEmail } from "../utils/mailer";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "devpilot_super_secret_token_123";

// Helper to generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register - request OTP
router.post("/register", async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Please provide email, password, and name" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ error: "User already exists with this email" });
      }
      
      // If user exists but is NOT verified, update their credentials and send a new OTP
      const passwordHash = await bcrypt.hash(password, 10);
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.user.update({
        where: { email },
        data: {
          name,
          passwordHash,
          otpCode: otp,
          otpExpiry,
        },
      });

      await sendOTPEmail(email, otp, name);

      return res.status(200).json({
        status: "PENDING_VERIFICATION",
        email,
        message: "OTP sent to email. Please verify your account.",
      });
    }

    // New user path
    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        isVerified: false,
        otpCode: otp,
        otpExpiry,
        profile: {
          create: {
            skills: [],
          },
        },
      },
      include: {
        profile: true,
      },
    });

    await sendOTPEmail(email, otp, name);

    return res.status(200).json({
      status: "PENDING_VERIFICATION",
      email,
      message: "OTP sent to email. Please verify your account.",
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Something went wrong during registration" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Please provide email and OTP" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "User is already verified" });
    }

    if (!user.otpCode || !user.otpExpiry) {
      return res.status(400).json({ error: "No active verification request found" });
    }

    // Check code and expiry
    const isCodeValid = user.otpCode === otp.trim();
    const isNotExpired = new Date(user.otpExpiry) > new Date();

    if (!isCodeValid || !isNotExpired) {
      return res.status(400).json({ error: "Invalid or expired OTP code" });
    }

    // Mark as verified
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiry: null,
      },
    });

    const token = jwt.sign({ userId: updatedUser.id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        profile: user.profile,
      },
    });
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ error: "Something went wrong during verification" });
  }
});

// Resend OTP
router.post("/resend-otp", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Please provide email" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "User is already verified" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { email },
      data: {
        otpCode: otp,
        otpExpiry,
      },
    });

    await sendOTPEmail(email, otp, user.name);

    return res.status(200).json({ message: "OTP code resent successfully" });
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({ error: "Something went wrong while resending OTP" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Please provide email and password" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Check if verified. If not, generate OTP, send email, and block login until verified
    if (!user.isVerified) {
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.user.update({
        where: { email },
        data: {
          otpCode: otp,
          otpExpiry,
        },
      });

      await sendOTPEmail(email, otp, user.name);

      return res.status(403).json({
        error: "Your account is not verified. A verification code has been sent to your email.",
        isVerified: false,
        email,
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: user.profile,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Something went wrong during login" });
  }
});

export default router;
