import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { API_BASE_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { Github, Code, CheckCircle, Target, Award, User, RefreshCw, Send, Sparkles, Calendar, Zap, AlertTriangle, Trash2, Plus, ChevronRight } from "lucide-react";

// Custom activity heatmap grid (flow column, 26 weeks x 7 days)
function ActivityHeatmap({ calendar, username, colorTheme }) {
  let cells = [];
  if (calendar && Array.isArray(calendar)) {
    cells = calendar.map(day => ({
      level: day.level,
      count: day.count,
      date: day.date
    }));
  } else {
    const hash = username ? username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    cells = Array.from({ length: 182 }, (_, idx) => {
      const levelVal = (Math.sin(hash + idx * 7) * 10) + 10;
      let level = 0;
      if (levelVal > 16) level = 4;
      else if (levelVal > 12) level = 3;
      else if (levelVal > 8) level = 2;
      else if (levelVal > 4) level = 1;
      
      const d = new Date();
      d.setDate(d.getDate() - (181 - idx));
      return {
        level,
        count: level * 2,
        date: d.toISOString().split("T")[0]
      };
    });
  }

  const colors = {
    green: ["rgba(255, 255, 255, 0.06)", "#C6E48B", "#7BC96F", "#239A3B", "#196127"],
    orange: ["rgba(255, 255, 255, 0.06)", "#FFE4B5", "#FFA500", "#FF8C00", "#D2691E"]
  }[colorTheme || "green"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
      <div style={{ display: "grid", gridAutoFlow: "column", gridTemplateRows: "repeat(7, 10px)", gap: "3px", overflowX: "auto", paddingBottom: "4px" }}>
        {cells.map((day, i) => (
          <div
            key={i}
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "2px",
              background: colors[day.level] || colors[0],
              transition: "var(--transition)"
            }}
            title={`${day.count} contributions on ${day.date}`}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)" }}>
        <span>6 Months Ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { token, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [githubUser, setGithubUser] = useState("");
  const [leetcodeUser, setLeetcodeUser] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [skills, setSkills] = useState("");
  
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [applications, setApplications] = useState([]);
  const [fetchingApps, setFetchingApps] = useState(false);

  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem("interview_checklist_v1");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const fetchApplications = async () => {
    try {
      setFetchingApps(true);
      const res = await fetch(`${API_BASE_URL}/api/applications`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (e) {
      console.error("Error fetching applications:", e);
    } finally {
      setFetchingApps(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchApplications();
    }
  }, [token]);

  const handlePromoteStatus = async (appId, currentStatus) => {
    const statusOrder = ["SAVED", "APPLIED", "INTERVIEWING", "OFFERED", "REJECTED"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex >= statusOrder.length - 2) return;
    
    const nextStatus = statusOrder[currentIndex + 1];
    try {
      const res = await fetch(`${API_BASE_URL}/api/applications/${appId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchApplications();
      }
    } catch (e) {
      console.error("Error updating application status:", e);
    }
  };

  const handleDeleteApplication = async (appId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/applications/${appId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchApplications();
      }
    } catch (e) {
      console.error("Error deleting application:", e);
    }
  };

  const handleToggleChecklist = (id) => {
    const updated = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(updated);
    localStorage.setItem("interview_checklist_v1", JSON.stringify(updated));
  };

  const getResumeFeedback = () => {
    if (user?.profile?.analysisResult) {
      try {
        const parsed = JSON.parse(user.profile.analysisResult);
        return parsed.resume_feedback || [];
      } catch (e) {}
    }
    return [];
  };

  const statuses = [
    { key: "SAVED", label: "Saved", color: "var(--text-secondary)" },
    { key: "APPLIED", label: "Applied", color: "var(--primary)" },
    { key: "INTERVIEWING", label: "Interviewing", color: "#F59E0B" },
    { key: "OFFERED", label: "Offered", color: "var(--success)" }
  ];

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

  const renderAICoachReminders = () => {
    const resumeScore = getResumeScore();
    const streak = user?.leetcodeStats?.streak || 0;
    const latestRepo = user?.githubStats?.latestRepo;
    const currentTarget = user?.profile?.targetRole || "Software Developer";

    const reminders = [];

    // 1. Resume Match Tip
    if (resumeScore === 0) {
      reminders.push({
        id: "resume-empty",
        type: "tip",
        icon: <Award size={16} color="var(--primary)" />,
        text: `You haven't run a resume audit yet! Go to the 'Resume Audit' tab to analyze your qualifications for '${currentTarget}' roles.`
      });
    } else if (resumeScore < 60) {
      reminders.push({
        id: "resume-improve",
        type: "warning",
        icon: <AlertTriangle size={16} color="var(--warning)" />,
        text: `Your resume match rating is at ${resumeScore}%. Add details about your target skills to push it past 70%.`
      });
    } else {
      reminders.push({
        id: "resume-good",
        type: "success",
        icon: <CheckCircle size={16} color="var(--secondary)" />,
        text: `Great job! Your resume matches ${resumeScore}% of requirements for '${currentTarget}' roles. Keep refining details!`
      });
    }

    // 2. GitHub Activity reminder
    if (latestRepo) {
      const days = Math.round((Date.now() - new Date(latestRepo.updatedAt).getTime()) / (24 * 3600000));
      reminders.push({
        id: "github-activity",
        type: "info",
        icon: <Github size={16} color="var(--primary)" />,
        text: `Your last GitHub push to '${latestRepo.name}' was ${days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`}. Keep committing to stay active!`
      });
    } else {
      reminders.push({
        id: "github-link",
        type: "tip",
        icon: <Github size={16} color="var(--text-secondary)" />,
        text: "Sync your GitHub username to track repo updates and visualize your contribution heatmap."
      });
    }

    // 3. LeetCode / DSA recommendation
    if (user?.leetcodeStats) {
      const recent = user.leetcodeStats.recentSubmissions?.[0];
      if (recent) {
        const nextProblemMap = {
          "unique-paths": { title: "Unique Paths II", slug: "unique-paths-ii" },
          "partition-equal-subset-sum": { title: "Target Sum", slug: "target-sum" },
          "house-robber": { title: "House Robber II", slug: "house-robber-ii" },
          "climbing-stairs": { title: "Min Cost Climbing Stairs", slug: "min-cost-climbing-stairs" },
          "fibonacci-number": { title: "Climbing Stairs", slug: "climbing-stairs" },
          "combination-sum-iii": { title: "Combination Sum", slug: "combination-sum" },
          "valid-parentheses": { title: "Generate Parentheses", slug: "generate-parentheses" },
          "best-time-to-buy-and-sell-stock": { title: "Best Time to Buy and Sell Stock II", slug: "best-time-to-buy-and-sell-stock-ii" },
          "maximum-depth-of-binary-tree": { title: "Balanced Binary Tree", slug: "balanced-binary-tree" },
          "binary-tree-level-order-traversal": { title: "Binary Tree Right Side View", slug: "binary-tree-right-side-view" },
          "binary-tree-inorder-traversal": { title: "Binary Tree Postorder Traversal", slug: "binary-tree-postorder-traversal" },
        };
        const nextProb = nextProblemMap[recent.titleSlug] || { title: "Two Sum", slug: "two-sum" };

        reminders.push({
          id: "leetcode-dsa",
          type: "dsa",
          icon: <Code size={16} color="var(--primary)" />,
          text: (
            <span>
              You recently solved{" "}
              <a 
                href={`https://leetcode.com/problems/${recent.titleSlug}/`} 
                target="_blank" 
                rel="noreferrer" 
                style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "underline" }}
              >
                {recent.title}
              </a> ({recent.difficulty}). We recommend trying{" "}
              <a 
                href={`https://leetcode.com/problems/${nextProb.slug}/`} 
                target="_blank" 
                rel="noreferrer" 
                style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "underline" }}
              >
                {nextProb.title}
              </a> next to prepare for your target role.
            </span>
          )
        });
      }
      if (streak > 0) {
        reminders.push({
          id: "leetcode-streak",
          type: "streak",
          icon: <Zap size={16} color="#F59E0B" />,
          text: `You have a ${streak}-day active coding streak on LeetCode! Maintain your progress today.`
        });
      }
    } else {
      reminders.push({
        id: "leetcode-link",
        type: "tip",
        icon: <Code size={16} color="var(--text-secondary)" />,
        text: "Link your LeetCode profile to monitor solve percentages and practice heatmaps."
      });
    }

    return reminders;
  };

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

      {/* AI Career Coach Reminders Panel */}
      <div 
        className="glass-panel animate-float shimmer-card" 
        style={{ 
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(168, 85, 247, 0.06) 100%)", 
          border: "1px solid rgba(99, 102, 241, 0.2)",
          display: "flex", 
          flexDirection: "column", 
          gap: "14px",
          padding: "20px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Sparkles size={20} color="var(--primary)" className="animate-pulse" />
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>AI Career Coach Reminders</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {renderAICoachReminders().map((reminder) => (
            <div 
              key={reminder.id} 
              className="glass-card" 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                padding: "10px 14px",
                borderLeft: "4px solid var(--primary)",
                background: "rgba(255, 255, 255, 0.02)"
              }}
            >
              {reminder.icon}
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-primary)", fontWeight: "500" }}>
                {reminder.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Row Grid */}
      <div className="grid-3">
        {/* Metric 1: Resume Strength */}
        <div className="glass-panel animate-slide-up delay-1" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
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
        <div className="glass-panel animate-slide-up delay-2" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
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
        <div className="glass-panel animate-slide-up delay-3" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
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

      {/* Row 2.5: Compact Trackers & Widgets (Checklist, Gaps, DSA Focus) */}
      <div className="grid-3">
        {/* Left Column: Interview Prep Checklist */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>Interview Prep Checklist</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
            {[
              { id: "linkedin", text: "Optimize LinkedIn & Portfolio links" },
              { id: "resume", text: "Audit resume score past 75%" },
              { id: "dsa_practice", text: "Solve daily LeetCode medium questions" },
              { id: "sys_design", text: "Revise system design (caching)" },
              { id: "behavioral", text: "Formulate answers using STAR method" }
            ].map(item => (
              <label 
                key={item.id}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "10px", 
                  cursor: "pointer", 
                  padding: "6px 10px", 
                  borderRadius: "6px", 
                  border: "1px solid var(--border-color)",
                  background: checkedItems[item.id] ? "rgba(16, 185, 129, 0.05)" : "var(--card-bg)",
                  textDecoration: checkedItems[item.id] ? "line-through" : "none",
                  color: checkedItems[item.id] ? "var(--text-secondary)" : "var(--text-primary)"
                }}
              >
                <input 
                  type="checkbox"
                  checked={!!checkedItems[item.id]}
                  onChange={() => handleToggleChecklist(item.id)}
                  style={{ width: "14px", height: "14px", accentColor: "var(--primary)" }}
                />
                <span style={{ fontSize: "12px", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.text}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Center Column: AI Resume Gaps */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0, fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>
            <AlertTriangle size={16} color="#F59E0B" />
            AI Resume Audit Gaps
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px", maxHeight: "190px", overflowY: "auto", paddingRight: "4px" }}>
            {getResumeFeedback().length > 0 ? (
              getResumeFeedback().map((item, idx) => (
                <div key={idx} className="glass-card" style={{ display: "flex", gap: "6px", padding: "6px 10px", borderLeft: "3px solid #F59E0B", background: "var(--card-bg)" }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-primary)", lineHeight: "1.3" }}>{item}</p>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "20px 10px", color: "var(--text-secondary)", fontSize: "12px" }}>
                No pending gaps detected! Go to <a href="/resume" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "underline" }}>Resume Audit</a> to scan your resume.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: DSA Practice Focus */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0, fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>
              <Zap size={16} color="var(--primary)" />
              Daily DSA Practice
            </h3>
            <p style={{ margin: 0, fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Solve targeted coding challenges to match technical role requirements.
            </p>
            <div style={{ background: "var(--primary-glow)", padding: "10px 12px", borderRadius: "6px", border: "1px solid rgba(99,102,241,0.15)", marginTop: "4px" }}>
              <span style={{ fontSize: "11.5px", fontWeight: "600", display: "block", color: "var(--text-primary)" }}>Today's Focus:</span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Arrays, Hash Maps & Dynamic Programming</span>
            </div>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => window.open("https://leetcode.com/problemset/all/", "_blank")}
            style={{ fontSize: "11.5px", padding: "8px 12px", width: "100%", justifyContent: "center", marginTop: "8px" }}
          >
            Solve on LeetCode
          </button>
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
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <img
                  src={user.githubStats.avatarUrl}
                  alt="Avatar"
                  style={{ width: "64px", height: "64px", borderRadius: "50%", border: "2px solid var(--primary)" }}
                />
                <div>
                  <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                    <Github size={18} />
                    {user.githubStats.username}
                  </h3>
                  <p style={{ margin: "4px 0", fontSize: "12px", color: "var(--text-secondary)" }}>{user.githubStats.bio}</p>
                  <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "12px" }}>
                    <span><strong>{user.githubStats.publicRepos}</strong> Repos</span>
                    <span><strong>{user.githubStats.totalCommitsThisYear}</strong> Commits (Year)</span>
                  </div>
                </div>
              </div>

              {/* GitHub Heatmap */}
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                <h4 style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 8px 0", textTransform: "uppercase", fontWeight: "600" }}>Contribution Graph</h4>
                <ActivityHeatmap calendar={user.githubStats.calendar} username={user.githubStats.username} colorTheme="green" />
              </div>

              {/* Latest Repo Update */}
              {user.githubStats.latestRepo && (
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                  <h4 style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 8px 0", textTransform: "uppercase", fontWeight: "600" }}>Latest Repository Update</h4>
                  <div style={{ background: "rgba(255, 255, 255, 0.02)", borderRadius: "6px", padding: "10px", border: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <a href={user.githubStats.latestRepo.url} target="_blank" rel="noreferrer" style={{ fontWeight: "600", fontSize: "13px", color: "var(--primary)", textDecoration: "underline" }}>
                        {user.githubStats.latestRepo.name}
                      </a>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                        {new Date(user.githubStats.latestRepo.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.4" }}>
                      {user.githubStats.latestRepo.description}
                    </p>
                  </div>
                </div>
              )}

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
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                  <Code size={18} />
                  LeetCode: {user.leetcodeStats.username}
                </h3>
                <span className="badge badge-secondary" style={{ fontSize: "11px" }}>Global Ranking: #{user.leetcodeStats.ranking.toLocaleString()}</span>
              </div>

              {/* Progress bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>Easy ({user.leetcodeStats.easy})</span>
                    <span>{easyPct}%</span>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.08)", height: "6px", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                    <div style={{ background: "var(--success)", height: "100%", width: `${easyPct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>Medium ({user.leetcodeStats.medium})</span>
                    <span>{medPct}%</span>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.08)", height: "6px", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                    <div style={{ background: "var(--primary)", height: "100%", width: `${medPct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>Hard ({user.leetcodeStats.hard})</span>
                    <span>{hardPct}%</span>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.08)", height: "6px", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                    <div style={{ background: "var(--secondary)", height: "100%", width: `${hardPct}%` }}></div>
                  </div>
                </div>
              </div>

              {/* LeetCode Heatmap */}
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                <h4 style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 8px 0", textTransform: "uppercase", fontWeight: "600" }}>Coding Practice Graph</h4>
                <ActivityHeatmap calendar={user.leetcodeStats.calendar} username={user.leetcodeStats.username} colorTheme="orange" />
              </div>

              {/* Recently Solved Questions */}
              {user.leetcodeStats.recentSubmissions && (
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                  <h4 style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 8px 0", textTransform: "uppercase", fontWeight: "600" }}>Recently Solved Questions</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {user.leetcodeStats.recentSubmissions.map((sub, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255, 255, 255, 0.02)", borderRadius: "6px", padding: "8px 12px", border: "1px solid var(--border-color)" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)" }}>{sub.title}</span>
                          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            Solved {new Date(sub.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="badge" style={{
                          fontSize: "10px",
                          background: sub.difficulty === "Easy" ? "rgba(16,185,129,0.12)" : sub.difficulty === "Medium" ? "rgba(37,99,235,0.12)" : "rgba(239,68,68,0.12)",
                          color: sub.difficulty === "Easy" ? "var(--success)" : sub.difficulty === "Medium" ? "var(--primary)" : "var(--error)"
                        }}>
                          {sub.difficulty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
              No LeetCode profile linked. Enter username to monitor problem breakdowns.
            </div>
          )}

        </div>
      </div>

      {/* Row 3: Job Application Pipeline (Kanban) */}
      <div className="glass-panel" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: 0 }}>Job Application Pipeline</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
              Track your active job applications dynamically. Promote their status as they progress.
            </p>
          </div>
          <button 
            className="btn-primary"
            onClick={() => navigate("/jobs")}
            style={{ fontSize: "13px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            Find More Jobs <ChevronRight size={16} />
          </button>
        </div>

        {fetchingApps ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading tracker...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginTop: "16px" }}>
            {statuses.map(col => {
              const colApps = applications.filter(app => app.status === col.key);
              return (
                <div key={col.key} className="glass-card" style={{ background: "rgba(255, 255, 255, 0.02)", display: "flex", flexDirection: "column", minHeight: "220px", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${col.color}`, paddingBottom: "8px", marginBottom: "12px" }}>
                    <span style={{ fontWeight: "700", color: col.color, fontSize: "14px", textTransform: "uppercase" }}>{col.label}</span>
                    <span className="badge" style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.06)" }}>{colApps.length}</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                    {colApps.map(app => (
                      <div key={app.id} className="glass-card animate-fade" style={{ background: "var(--card-bg)", padding: "10px 12px", border: "1px solid var(--border-color)", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {app.jobTitle}
                          </span>
                          <button 
                            onClick={() => handleDeleteApplication(app.id)}
                            style={{ background: "transparent", border: "none", color: "#EF4444", cursor: "pointer", padding: "2px" }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{app.company}</span>
                          {col.key !== "OFFERED" && (
                            <button
                              onClick={() => handlePromoteStatus(app.id, app.status)}
                              style={{
                                background: "rgba(37,99,235,0.08)",
                                border: "1px solid rgba(37,99,235,0.2)",
                                borderRadius: "4px",
                                padding: "2px 6px",
                                color: "var(--primary)",
                                fontSize: "10px",
                                cursor: "pointer",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "2px"
                              }}
                              title="Promote status"
                            >
                              Move Next →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {colApps.length === 0 && (
                      <div style={{ margin: "auto", fontSize: "12px", color: "var(--text-secondary)", textAlign: "center", padding: "16px" }}>
                        Empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
