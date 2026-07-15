import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { Github, Code, CheckCircle, Target, Award, User, RefreshCw, Send } from "lucide-react";

export default function Dashboard() {
  const { token, user, refreshProfile } = useAuth();
  
  const [githubUser, setGithubUser] = useState("");
  const [leetcodeUser, setLeetcodeUser] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [skills, setSkills] = useState("");
  
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sync state with loaded user profile details
  useEffect(() => {
    if (user?.profile) {
      setGithubUser(user.profile.githubUsername || "");
      setLeetcodeUser(user.profile.leetcodeUsername || "");
      setTargetRole(user.profile.targetRole || "");
      setSkills(user.profile.skills?.join(", ") || "");
    }
  }, [user]);

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
      const res = await fetch("http://localhost:5000/api/profile", {
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
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getResumeScore = () => {
    if (user?.profile?.analysisResult) {
      try {
        const parsed = JSON.parse(user.profile.analysisResult);
        return parsed.resume_score || 0;
      } catch (e) {}
    }
    return 0;
  };

  const getRoadmapProgress = () => {
    if (user?.profile?.analysisResult) {
      try {
        const parsed = JSON.parse(user.profile.analysisResult);
        return parsed.learning_roadmap ? parsed.learning_roadmap.length : 0;
      } catch (e) {}
    }
    return 0;
  };

  // Calculate problem shares
  const lc = user?.leetcodeStats;
  const lcTotal = lc?.totalSolved || 0;
  const easyPct = lcTotal ? Math.round((lc.easy / lcTotal) * 100) : 0;
  const medPct = lcTotal ? Math.round((lc.medium / lcTotal) * 100) : 0;
  const hardPct = lcTotal ? Math.round((lc.hard / lcTotal) * 100) : 0;

  return (
    <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      
      {/* Top Banner */}
      <div>
        <h1 style={{ marginBottom: "4px" }}>Welcome Back, {user?.profile?.user?.name || "Candidate"}!</h1>
        <p>Your engineering career preparation dashboard. Sync profile handles to generate metrics.</p>
      </div>

      {success && (
        <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid var(--secondary)", color: "#a7f3d0", padding: "16px", borderRadius: "12px", fontSize: "14px" }}>
          {success}
        </div>
      )}

      {/* Main Row Grid */}
      <div className="grid-3">
        {/* Metric 1: Resume Strength */}
        <div className="glass-panel" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ color: "var(--primary)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--primary-glow)" }}>
            <Award size={24} />
          </div>
          <div>
            <p style={{ fontWeight: "500", fontSize: "13px" }}>Resume Strength</p>
            <h2 style={{ fontSize: "28px", margin: 0, fontWeight: "600", color: "var(--text-primary)" }}>
              {getResumeScore() > 0 ? `${getResumeScore()}%` : "Unrated"}
            </h2>
          </div>
        </div>

        {/* Metric 2: LeetCode Solutions */}
        <div className="glass-panel" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ color: "var(--primary)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--primary-glow)" }}>
            <Code size={24} />
          </div>
          <div>
            <p style={{ fontWeight: "500", fontSize: "13px" }}>LeetCode Solved</p>
            <h2 style={{ fontSize: "28px", margin: 0, fontWeight: "600", color: "var(--text-primary)" }}>
              {lcTotal > 0 ? lcTotal : "0"}
            </h2>
          </div>
        </div>

        {/* Metric 3: Active Roadmaps */}
        <div className="glass-panel" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ color: "var(--primary)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--primary-glow)" }}>
            <Target size={24} />
          </div>
          <div>
            <p style={{ fontWeight: "500", fontSize: "13px" }}>Learning Phases</p>
            <h2 style={{ fontSize: "28px", margin: 0, fontWeight: "600", color: "var(--text-primary)" }}>
              {getRoadmapProgress() > 0 ? getRoadmapProgress() : "0"}
            </h2>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Card: Coding Profile Sync */}
        <div className="glass-panel">
          <h2>Synchronize Handles</h2>
          <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                Target Role
              </label>
              <input
                type="text"
                placeholder="e.g. Backend Developer, AI Engineer"
                className="form-input"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
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
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                LeetCode Username
              </label>
              <input
                type="text"
                placeholder="e.g. leetcode_dev"
                className="form-input"
                value={leetcodeUser}
                onChange={(e) => setLeetcodeUser(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                Tech Stack / Skills (comma separated)
              </label>
              <textarea
                placeholder="e.g. React, Node.js, Python, PostgreSQL"
                className="form-input"
                style={{ height: "80px", resize: "none" }}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
              disabled={updating}
            >
              {updating ? "Syncing..." : "Update & Sync Handles"}
              <RefreshCw size={18} className={updating ? "animate-spin" : ""} />
            </button>
          </form>
        </div>

        {/* Right Card: Coding Analytics Details */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2>Coding Profile Metrics</h2>

          {/* GitHub Stats Box */}
          {user?.githubStats ? (
            <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <img
                src={user.githubStats.avatarUrl}
                alt="Avatar"
                style={{ width: "64px", height: "64px", borderRadius: "50%", border: "2px solid var(--primary)" }}
              />
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Github size={18} />
                  {user.githubStats.username}
                </h3>
                <p style={{ margin: "4px 0" }}>{user.githubStats.bio}</p>
                <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                  <span><strong>{user.githubStats.publicRepos}</strong> Repos</span>
                  <span><strong>{user.githubStats.totalCommitsThisYear}</strong> Commits (Year)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
              No GitHub profile linked. Enter username on the left to pull repository statistics.
            </div>
          )}

          {/* LeetCode Stats Box */}
          {user?.leetcodeStats ? (
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Code size={18} />
                  LeetCode: {user.leetcodeStats.username}
                </h3>
                <span className="badge badge-secondary">Global Ranking: #{user.leetcodeStats.ranking.toLocaleString()}</span>
              </div>

              {/* Progress bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>Easy ({user.leetcodeStats.easy})</span>
                    <span>{easyPct}%</span>
                  </div>
                  <div style={{ background: "#E5E7EB", height: "6px", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                    <div style={{ background: "var(--success)", height: "100%", width: `${easyPct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>Medium ({user.leetcodeStats.medium})</span>
                    <span>{medPct}%</span>
                  </div>
                  <div style={{ background: "#E5E7EB", height: "6px", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                    <div style={{ background: "var(--primary)", height: "100%", width: `${medPct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>Hard ({user.leetcodeStats.hard})</span>
                    <span>{hardPct}%</span>
                  </div>
                  <div style={{ background: "#E5E7EB", height: "6px", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                    <div style={{ background: "#1D4ED8", height: "100%", width: `${hardPct}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
              No LeetCode profile linked. Enter username to monitor problem breakdowns.
            </div>
          )}

        </div>
      </div>
      
    </div>
  );
}
