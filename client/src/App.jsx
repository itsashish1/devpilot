import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Map, Briefcase, Mail, LogOut, ArrowRight, User } from "lucide-react";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ResumeReview from "./pages/ResumeReview";
import Roadmap from "./pages/Roadmap";
import JobBoard from "./pages/JobBoard";
import Outreach from "./pages/Outreach";

// Authentication Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

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

  const fetchProfile = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/profile", {
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
    <AuthContext.Provider value={{ token, user, login, logout, refreshProfile }}>
      <Router>
        <Routes>
          <Route path="/login" element={!token ? <Auth /> : <Navigate to="/" />} />
          <Route
            path="/*"
            element={token ? <AppLayout /> : <Navigate to="/login" />}
          />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

// Side Navigation Layout
function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
    { name: "Resume Audit", path: "/resume", icon: <FileText size={20} /> },
    { name: "Personalized Roadmap", path: "/roadmap", icon: <Map size={20} /> },
    { name: "Job Finder", path: "/jobs", icon: <Briefcase size={20} /> },
    { name: "Outreach Copilot", path: "/outreach", icon: <Mail size={20} /> },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
            <div style={{
              background: "#2563EB",
              width: "32px",
              height: "32px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "14px",
              color: "#ffffff"
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
                    color: isActive ? "#2563EB" : "var(--text-secondary)",
                    background: isActive ? "rgba(37, 99, 235, 0.08)" : "transparent",
                    borderLeft: isActive ? "2px solid #2563EB" : "2px solid transparent",
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

        {/* User profile footer info */}
        <div>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 8px", borderBottom: "1px solid var(--border-color)", marginBottom: "12px" }}>
              <div style={{ background: "rgba(255, 255, 255, 0.05)", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-color)" }}>
                <User size={20} color="var(--text-secondary)" />
              </div>
              <div style={{ overflow: "hidden" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "600", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{user?.profile?.user?.name || "Candidate"}</h3>
                <p style={{ fontSize: "12px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{user?.profile?.targetRole || "Software Developer"}</p>
              </div>
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
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/jobs" element={<JobBoard />} />
          <Route path="/outreach" element={<Outreach />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
