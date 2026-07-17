import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { LogIn, UserPlus, Mail, Lock, User, ArrowRight, ShieldCheck, RefreshCw, ArrowLeft } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState("auth"); // "auth" or "otp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

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
      const res = await fetch(`http://localhost:5000${endpoint}`, {
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
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
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
      const res = await fetch("http://localhost:5000/api/auth/resend-otp", {
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

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "20px",
      background: "var(--bg-color)"
    }}>
      <div className="glass-panel animate-fade" style={{ width: "100%", maxWidth: "440px", padding: "40px", borderRadius: "8px" }}>
        
        {/* Logo/Branding */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            background: "var(--primary)",
            width: "48px",
            height: "48px",
            borderRadius: "6px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "700",
            fontSize: "18px",
            color: "#ffffff",
            marginBottom: "16px"
          }}>DP</div>
          <h1 style={{ fontSize: "24px", margin: 0, fontWeight: "600" }}>DevPilot</h1>
          <p style={{ marginTop: "4px", fontSize: "14px" }}>Unified Engineering Career Platform</p>
        </div>

        {step === "auth" ? (
          <>
            {/* Tab Toggle */}
            <div style={{
              display: "flex",
              background: "#F3F4F6",
              borderRadius: "6px",
              padding: "3px",
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
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
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
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
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
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                  Password
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
          </>
        ) : (
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
        )}
      </div>
    </div>
  );
}
