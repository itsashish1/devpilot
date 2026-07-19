import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { API_BASE_URL } from "../config";
import { LogIn, UserPlus, Mail, Lock, User, ArrowRight, ShieldCheck, RefreshCw, ArrowLeft } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState("auth"); // "auth", "otp", "forgot", "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google authentication failed");
      }

      login(data.token, data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In failed. Please try again.");
  };

  // Countdown timer for Resend OTP
  const [countdown, setCountdown] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timerActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setTimerActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResendMessage("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin ? { email, password } : { email, password, name };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // Handle unverified account attempt
      if (res.status === 403 && data.isVerified === false) {
        setStep("otp");
        setEmail(data.email);
        setCountdown(30);
        setTimerActive(true);
        setError("Your account is not verified. A verification code has been sent to your email.");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (data.status === "PENDING_VERIFICATION") {
        setStep("otp");
        setEmail(data.email);
        setCountdown(30);
        setTimerActive(true);
        return;
      }

      // Store JWT & profile info
      login(data.token, data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setResendMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      login(data.token, data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setResendMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend OTP");
      }

      setResendMessage("Verification code resent successfully!");
      setCountdown(30);
      setTimerActive(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset code");

      setSuccessMessage(data.message);
      setStep("reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      setSuccessMessage("Password reset successfully! Please login with your new password.");
      setStep("auth");
      setIsLogin(true);
      setPassword("");
      setOtp("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "20px",
      background: "var(--bg-color)",
      position: "relative"
    }}>
      {/* Liquid Glass Background Blobs */}
      <div className="liquid-blob-container">
        <div className="liquid-blob blob-primary"></div>
        <div className="liquid-blob blob-secondary"></div>
        <div className="liquid-blob blob-success"></div>
      </div>

      <div className="glass-panel animate-fade" style={{ width: "100%", maxWidth: "440px", padding: "40px", borderRadius: "16px", zIndex: 1 }}>
        
        {/* Logo/Branding */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
            width: "48px",
            height: "48px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            fontSize: "20px",
            color: "#ffffff",
            marginBottom: "16px",
            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)"
          }}>DP</div>
          <h1 style={{ fontSize: "24px", margin: 0, fontWeight: "700" }}>DevPilot</h1>
          <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-secondary)" }}>Unified Engineering Career Platform</p>
        </div>

        {step === "auth" ? (
          <>
            {/* Tab Toggle */}
            <div style={{
              display: "flex",
              background: "rgba(255, 255, 255, 0.04)",
              borderRadius: "10px",
              padding: "4px",
              marginBottom: "24px",
              border: "1px solid var(--border-color)"
            }}>
              <button
                onClick={() => { setIsLogin(true); setError(""); setResendMessage(""); }}
                style={{
                  flex: 1,
                  background: isLogin ? "var(--primary)" : "transparent",
                  color: isLogin ? "#ffffff" : "var(--text-secondary)",
                  border: "none",
                  padding: "8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "var(--transition)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <LogIn size={14} /> Login
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(""); setResendMessage(""); }}
                style={{
                  flex: 1,
                  background: !isLogin ? "var(--primary)" : "transparent",
                  color: !isLogin ? "#ffffff" : "var(--text-secondary)",
                  border: "none",
                  padding: "8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "var(--transition)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <UserPlus size={14} /> Register
              </button>
            </div>

            {error && (
              <div style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid var(--error)",
                borderRadius: "8px",
                padding: "12px",
                color: "#fca5a5",
                fontSize: "14px",
                marginBottom: "20px",
                textAlign: "center"
              }}>
                {error}
              </div>
            )}

            {successMessage && step === "auth" && (
              <div style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid var(--success)",
                borderRadius: "8px",
                padding: "12px",
                color: "#6ee7b7",
                fontSize: "13px",
                marginBottom: "20px",
                textAlign: "center"
              }}>
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {!isLogin && (
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                    Full Name
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>
                      <User size={18} />
                    </span>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="form-input"
                      style={{ paddingLeft: "42px" }}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    placeholder="developer@college.edu"
                    className="form-input"
                    style={{ paddingLeft: "42px" }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                  <span>Password</span>
                  {isLogin && (
                    <span 
                      onClick={() => {
                        setStep("forgot");
                        setError("");
                        setSuccessMessage("");
                      }}
                      style={{ color: "var(--primary)", cursor: "pointer", textTransform: "none", fontWeight: "500" }}
                    >
                      Forgot Password?
                    </span>
                  )}
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="form-input"
                    style={{ paddingLeft: "42px" }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: "10px", padding: "14px" }}
                disabled={loading}
              >
                {loading ? "Processing..." : isLogin ? "Login Now" : "Create Account"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", margin: "20px 0", color: "var(--text-secondary)" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }}></div>
              <span style={{ padding: "0 10px", fontSize: "12px", textTransform: "uppercase" }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }}></div>
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                shape="rectangular"
                width="360"
              />
            </div>
          </>
        ) : step === "otp" ? (
          <div className="animate-fade">
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{
                background: "rgba(37, 99, 235, 0.1)",
                color: "var(--primary)",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px"
              }}>
                <ShieldCheck size={24} />
              </div>
              <h2 style={{ fontSize: "20px", margin: "0 0 8px 0" }}>Verify Your Email</h2>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                We sent a 6-digit verification code to<br />
                <strong style={{ color: "var(--text-primary)" }}>{email}</strong>
              </p>
            </div>

            {error && (
              <div style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid var(--error)",
                borderRadius: "8px",
                padding: "12px",
                color: "#fca5a5",
                fontSize: "13px",
                marginBottom: "20px",
                textAlign: "center"
              }}>
                {error}
              </div>
            )}

            {resendMessage && (
              <div style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid var(--success)",
                borderRadius: "8px",
                padding: "12px",
                color: "#6ee7b7",
                fontSize: "13px",
                marginBottom: "20px",
                textAlign: "center"
              }}>
                {resendMessage}
              </div>
            )}

            <form onSubmit={handleVerifyOTP} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px", textAlign: "center" }}>
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="form-input"
                  style={{
                    textAlign: "center",
                    fontSize: "24px",
                    letterSpacing: "8px",
                    fontWeight: "700",
                    fontFamily: "var(--font-mono)",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.05)"
                  }}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "14px" }}
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify & Activate Account"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
              <button
                onClick={handleResendOTP}
                disabled={timerActive}
                style={{
                  background: "transparent",
                  border: "none",
                  color: timerActive ? "var(--text-secondary)" : "var(--primary)",
                  cursor: timerActive ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <RefreshCw size={14} className={timerActive ? "" : "animate-spin-hover"} />
                {timerActive ? `Resend Code in ${countdown}s` : "Resend OTP Code"}
              </button>

              <button
                onClick={() => {
                  setStep("auth");
                  setError("");
                  setResendMessage("");
                  setOtp("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "8px"
                }}
              >
                <ArrowLeft size={14} />
                Back to Login / Register
              </button>
            </div>
          </div>
        ) : step === "forgot" ? (
          <div className="animate-fade">
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{
                background: "rgba(37, 99, 235, 0.1)",
                color: "var(--primary)",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px"
              }}>
                <Lock size={24} />
              </div>
              <h2 style={{ fontSize: "20px", margin: "0 0 8px 0" }}>Reset Password</h2>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                Enter your email address to receive a password reset code.
              </p>
            </div>

            {error && (
              <div style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid var(--error)",
                borderRadius: "8px",
                padding: "12px",
                color: "#fca5a5",
                fontSize: "13px",
                marginBottom: "20px",
                textAlign: "center"
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    placeholder="developer@college.edu"
                    className="form-input"
                    style={{ paddingLeft: "42px" }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "14px" }}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Code"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => {
                  setStep("auth");
                  setError("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <ArrowLeft size={14} />
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade">
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{
                background: "rgba(16, 185, 129, 0.1)",
                color: "var(--success)",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px"
              }}>
                <ShieldCheck size={24} />
              </div>
              <h2 style={{ fontSize: "20px", margin: "0 0 8px 0" }}>Create New Password</h2>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                Enter the 6-digit code sent to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>
              </p>
            </div>

            {error && (
              <div style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid var(--error)",
                borderRadius: "8px",
                padding: "12px",
                color: "#fca5a5",
                fontSize: "13px",
                marginBottom: "20px",
                textAlign: "center"
              }}>
                {error}
              </div>
            )}

            {successMessage && (
              <div style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid var(--success)",
                borderRadius: "8px",
                padding: "12px",
                color: "#6ee7b7",
                fontSize: "13px",
                marginBottom: "20px",
                textAlign: "center"
              }}>
                {successMessage}
              </div>
            )}

            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px", textAlign: "center" }}>
                  Reset Code (OTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="form-input"
                  style={{
                    textAlign: "center",
                    fontSize: "24px",
                    letterSpacing: "8px",
                    fontWeight: "700",
                    fontFamily: "var(--font-mono)",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.05)"
                  }}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="form-input"
                    style={{ paddingLeft: "42px" }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "14px" }}
                disabled={loading || otp.length !== 6 || newPassword.length < 6}
              >
                {loading ? "Resetting..." : "Reset Password"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => {
                  setStep("auth");
                  setError("");
                  setSuccessMessage("");
                  setOtp("");
                  setNewPassword("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <ArrowLeft size={14} />
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
