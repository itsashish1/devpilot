import React, { useState } from "react";
import { useAuth } from "../App";
import { LogIn, UserPlus, Mail, Lock, User, ArrowRight } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Store JWT & profile info
      login(data.token, data);
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
            onClick={() => { setIsLogin(true); setError(""); }}
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
            onClick={() => { setIsLogin(false); setError(""); }}
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
      </div>
    </div>
  );
}
