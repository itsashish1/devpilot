import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Map, Briefcase, Mail, LogOut, ArrowRight, User, X, Settings, MessageSquare, MoreHorizontal } from "lucide-react";
import Auth from "./pages/Auth";
import LandingPage from "./pages/LandingPage";
import { API_BASE_URL } from "./config";
import Dashboard from "./pages/Dashboard";
import ResumeReview from "./pages/ResumeReview";
import Roadmap from "./pages/Roadmap";
import JobBoard from "./pages/JobBoard";
import Outreach from "./pages/Outreach";
import MockInterview from "./pages/MockInterview";

// Authentication Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "liquid-cobalt");

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      // Fetch user profile stats
      fetchProfile();
    } else {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        // Token expired/invalid
        setToken(null);
      }
    } catch (err) {
      console.error("Error checking profile:", err);
    }
  };

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const refreshProfile = () => {
    fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, refreshProfile, theme, setTheme }}>
      <Router>
        <Routes>
          {token ? (
            <Route path="/*" element={<AppLayout />} />
          ) : (
            <>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Auth />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

// Side Navigation Layout
function AppLayout() {
  const { user, logout, theme, setTheme, token, refreshProfile } = useAuth();
  const location = useLocation();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [githubUser, setGithubUser] = useState("");
  const [leetcodeUser, setLeetcodeUser] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [skills, setSkills] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const getMobileNavLinkStyle = (path) => {
    const isActive = path ? location.pathname === path : false;
    return {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
      color: isActive ? "var(--primary)" : "var(--text-secondary)",
      textDecoration: "none",
      flex: 1,
      justifyContent: "center",
      height: "100%",
      transition: "var(--transition)"
    };
  };

  useEffect(() => {
    if (user?.profile && isSettingsOpen) {
      setGithubUser(user.profile.githubUsername || "");
      setLeetcodeUser(user.profile.leetcodeUsername || "");
      setTargetRole(user.profile.targetRole || "");
      setSkills(user.profile.skills?.join(", ") || "");
      setError("");
      setSuccess("");
    }
  }, [user, isSettingsOpen]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    setSuccess("");

    const skillList = skills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");

    try {
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          githubUsername: githubUser,
          leetcodeUsername: leetcodeUser,
          targetRole,
          skills: skillList,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save profile credentials");
      }

      setSuccess("Profile settings successfully updated and synchronized!");
      refreshProfile();
      
      // Auto close modal after successful update
      setTimeout(() => {
        setIsSettingsOpen(false);
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const links = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
    { name: "Resume Audit", path: "/resume", icon: <FileText size={20} /> },
    { name: "Mock Interview", path: "/interview", icon: <MessageSquare size={20} /> },
    { name: "Personalized Roadmap", path: "/roadmap", icon: <Map size={20} /> },
    { name: "Job Finder", path: "/jobs", icon: <Briefcase size={20} /> },
    { name: "Outreach Copilot", path: "/outreach", icon: <Mail size={20} /> },
  ];

  const themes = [
    { id: "liquid-cobalt", name: "Liquid Cobalt (Dark)", primaryColor: "#4364F7", secondaryColor: "#0A0E1A" },
    { id: "frosty-ice", name: "Frosty Ice (Light)", primaryColor: "#3B82F6", secondaryColor: "#F0F5FA" }
  ];

  const renderSettingsModal = () => {
    if (!isSettingsOpen) return null;

    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        animation: "modalFadeIn 0.25s ease-out forwards",
      }}>
        {/* Modal Panel container */}
        <div 
          className="glass-panel"
          style={{
            width: "100%",
            maxWidth: "500px",
            background: "var(--panel-bg)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--panel-shadow)",
            borderRadius: "20px",
            padding: "28px",
            position: "relative",
            animation: "slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          }}
        >
          {/* Close trigger button */}
          <button 
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              transition: "var(--transition)",
              padding: "6px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <X size={18} />
          </button>

          {/* Settings title header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <Settings size={20} color="var(--primary)" />
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Settings & Profile Sync</h2>
          </div>

          <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Theme switcher dots grid inside modal settings */}
            <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "4px" }}>
              <span style={{ 
                fontSize: "11px", 
                fontWeight: "700", 
                textTransform: "uppercase", 
                color: "var(--text-secondary)", 
                letterSpacing: "0.05em", 
                display: "block", 
                marginBottom: "12px" 
              }}>
                Appearance Theme
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                {themes.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      title={t.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                        background: isSelected ? "var(--primary-glow)" : "var(--card-bg)",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        fontSize: "11.5px",
                        fontWeight: "600",
                        transition: "var(--transition)",
                        boxShadow: isSelected ? `0 0 10px ${t.primaryColor}33` : "none",
                        outline: "none"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "var(--border-hover)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "var(--border-color)";
                        }
                      }}
                    >
                      <span style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${t.primaryColor} 0%, ${t.secondaryColor} 100%)`,
                        display: "inline-block"
                      }} />
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile Handles Form fields */}
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                Target Role
              </label>
              <input
                type="text"
                placeholder="e.g. Backend Developer"
                className="form-input"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                  GitHub Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. octocat"
                  className="form-input"
                  value={githubUser}
                  onChange={(e) => setGithubUser(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                  LeetCode Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. leet_dev"
                  className="form-input"
                  value={leetcodeUser}
                  onChange={(e) => setLeetcodeUser(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                Tech Stack / Skills (comma separated)
              </label>
              <textarea
                placeholder="e.g. React, Node.js, Python, AWS"
                className="form-input"
                style={{ height: "60px", resize: "none" }}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>

            {error && (
              <span style={{ fontSize: "12px", color: "var(--error)", fontWeight: "600" }}>{error}</span>
            )}
            {success && (
              <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: "600" }}>{success}</span>
            )}

            {/* Modal Bottom Buttons */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setIsSettingsOpen(false)}
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={updating}
                style={{ padding: "8px 20px", fontSize: "13px" }}
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>

          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container" style={{ position: "relative" }}>
      {/* Premium Liquid Floating Glass Background Blobs */}
      <div className="liquid-blob-container">
        <div className="liquid-blob liquid-blob-1"></div>
        <div className="liquid-blob liquid-blob-2"></div>
        <div className="liquid-blob liquid-blob-3"></div>
      </div>

      {/* Mobile Top Header */}
      <header className="mobile-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            background: "var(--primary)",
            width: "28px",
            height: "28px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "700",
            fontSize: "12px",
            color: "#ffffff"
          }}>DP</div>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>
            DevPilot
          </h2>
        </div>
        
        {user && (
          <div 
            onClick={() => setIsSettingsOpen(true)}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "6px", 
              padding: "4px 10px", 
              borderRadius: "20px",
              background: "var(--primary-glow)",
              border: "1px solid var(--border-color)",
              cursor: "pointer"
            }}
          >
            <User size={13} color="var(--primary)" />
            <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-primary)" }}>
              Profile
            </span>
          </div>
        )}
      </header>

      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
            <div style={{
              background: "var(--primary)",
              width: "32px",
              height: "32px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "14px",
              color: "#ffffff",
              boxShadow: "var(--glow-shadow)",
              transition: "var(--transition)"
            }}>DP</div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "var(--text-primary)" }}>
              DevPilot
            </h2>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    color: isActive ? "var(--primary)" : "var(--text-secondary)",
                    background: isActive ? "var(--primary-glow)" : "transparent",
                    borderLeft: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                    fontWeight: isActive ? "500" : "400",
                    fontSize: "14px",
                    transition: "var(--transition)"
                  }}
                >
                  {link.icon}
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile footer info (Trigger Modal) */}
        <div>
          {user && (
            <div 
              onClick={() => setIsSettingsOpen(true)}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                gap: "12px", 
                padding: "12px 10px", 
                marginBottom: "12px",
                cursor: "pointer",
                borderRadius: "8px",
                transition: "var(--transition)",
                border: "1px solid transparent"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--primary-glow)";
                e.currentTarget.style.borderColor = "var(--border-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                <div style={{ 
                  background: "var(--primary-glow)", 
                  borderRadius: "50%", 
                  width: "36px", 
                  height: "36px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  border: "1px solid var(--border-color)",
                  flexShrink: 0
                }}>
                  <User size={18} color="var(--primary)" />
                </div>
                <div style={{ overflow: "hidden" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: "600", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", color: "var(--text-primary)" }}>
                    {user?.profile?.user?.name || "Candidate"}
                  </h3>
                  <p style={{ fontSize: "11px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", color: "var(--text-secondary)" }}>
                    {user?.profile?.targetRole || "Software Developer"}
                  </p>
                </div>
              </div>
              <Settings size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
            </div>
          )}

          <button
            onClick={logout}
            className="btn-secondary"
            style={{ width: "100%", justifyContent: "center", padding: "10px" }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/resume" element={<ResumeReview />} />
          <Route path="/interview" element={<MockInterview />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/jobs" element={<JobBoard />} />
          <Route path="/outreach" element={<Outreach />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <Link to="/" style={getMobileNavLinkStyle("/")}>
          <LayoutDashboard size={20} />
          <span style={{ fontSize: "10px", marginTop: "2px" }}>Dashboard</span>
        </Link>
        <Link to="/resume" style={getMobileNavLinkStyle("/resume")}>
          <FileText size={20} />
          <span style={{ fontSize: "10px", marginTop: "2px" }}>Resume</span>
        </Link>
        <Link to="/interview" style={getMobileNavLinkStyle("/interview")}>
          <MessageSquare size={20} />
          <span style={{ fontSize: "10px", marginTop: "2px" }}>Interview</span>
        </Link>
        <Link to="/roadmap" style={getMobileNavLinkStyle("/roadmap")}>
          <Map size={20} />
          <span style={{ fontSize: "10px", marginTop: "2px" }}>Roadmap</span>
        </Link>
        <button 
          onClick={() => setIsMoreOpen(true)} 
          style={{
            ...getMobileNavLinkStyle(""),
            background: "none",
            border: "none",
            cursor: "pointer",
            color: isMoreOpen ? "var(--primary)" : "var(--text-secondary)"
          }}
        >
          <MoreHorizontal size={20} />
          <span style={{ fontSize: "10px", marginTop: "2px" }}>More</span>
        </button>
      </nav>

      {/* Mobile Bottom Sheet Drawer */}
      <div 
        className={`mobile-bottom-sheet-backdrop ${isMoreOpen ? "active" : ""}`}
        onClick={() => setIsMoreOpen(false)}
      />
      <div className={`mobile-bottom-sheet ${isMoreOpen ? "active" : ""}`}>
        <div className="mobile-bottom-sheet-handle" />
        <h3 style={{ fontSize: "15px", fontWeight: "700", textAlign: "center", marginBottom: "8px" }}>
          More Options
        </h3>
        <div className="mobile-menu-grid">
          <Link 
            to="/jobs" 
            className="mobile-menu-item"
            onClick={() => setIsMoreOpen(false)}
          >
            <Briefcase size={22} color="var(--primary)" />
            <span>Job Finder</span>
          </Link>
          <Link 
            to="/outreach" 
            className="mobile-menu-item"
            onClick={() => setIsMoreOpen(false)}
          >
            <Mail size={22} color="var(--primary)" />
            <span>Outreach Copilot</span>
          </Link>
          <div 
            className="mobile-menu-item"
            onClick={() => {
              setIsMoreOpen(false);
              setIsSettingsOpen(true);
            }}
          >
            <Settings size={22} color="var(--text-secondary)" />
            <span>Settings</span>
          </div>
          <div 
            className="mobile-menu-item"
            onClick={() => {
              setIsMoreOpen(false);
              logout();
            }}
            style={{ gridColumn: "span 3", border: "1px dashed var(--error)", background: "rgba(239, 68, 68, 0.05)", flexDirection: "row", justifyContent: "center", padding: "12px" }}
          >
            <LogOut size={16} color="var(--error)" />
            <span style={{ color: "var(--error)", fontWeight: "600" }}>Logout</span>
          </div>
        </div>
      </div>

      {/* Render Settings Overlay Modal */}
      {renderSettingsModal()}
    </div>
  );
}
