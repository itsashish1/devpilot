import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { useLocation } from "react-router-dom";
import { Mail, Send, Copy, Check, Cpu } from "lucide-react";

export default function Outreach() {
  const { user } = useAuth();
  const location = useLocation();

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [githubProjects, setGithubProjects] = useState("");
  const [userName, setUserName] = useState("");

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [copied, setCopied] = useState(false);

  // Load router state if navigated from JobBoard card details
  useEffect(() => {
    if (location.state) {
      setJobTitle(location.state.jobTitle || "");
      setCompany(location.state.company || "");
      setJobDescription(location.state.jobDescription || "");
    }
    if (user?.profile?.user?.name) {
      setUserName(user.profile.user.name);
    }
  }, [location.state, user]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!jobTitle || !company) {
      setError("Please provide both job title and company name.");
      return;
    }

    setGenerating(true);
    setError("");
    setCopied(false);

    const projectList = githubProjects
      ? githubProjects.split(",").map(p => p.trim())
      : ["Portfolio Repository"];

    try {
      const payload = {
        job_title: jobTitle,
        company,
        job_description: jobDescription || "Tech engineering role",
        github_projects: projectList,
        skills: user?.profile?.skills || [],
        user_name: userName || "Candidate",
      };

      const res = await fetch("http://localhost:8000/api/ai/cold-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to generate custom outreach draft");

      const data = await res.json();
      setEmailSubject(data.email_subject);
      setEmailBody(data.email_body);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    const fullText = `Subject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div>
        <h1>Outreach Copilot</h1>
        <p>Draft tailored LinkedIn or email cold outreach drafts customized with your active projects.</p>
      </div>

      {error && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "#fca5a5", padding: "16px", borderRadius: "12px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "32px" }}>
        {/* Left Side Inputs Form */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2>Target Specifications</h2>

          <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                Your Name (For Signature)
              </label>
              <input
                type="text"
                placeholder="e.g. Ashish"
                className="form-input"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                Job Title
              </label>
              <input
                type="text"
                placeholder="e.g. Backend Intern"
                className="form-input"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                Company Name
              </label>
              <input
                type="text"
                placeholder="e.g. Google"
                className="form-input"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                Projects to Highlight (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. ChatBot, Portfolio, DSATracker"
                className="form-input"
                value={githubProjects}
                onChange={(e) => setGithubProjects(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                Job Summary/Description (Optional)
              </label>
              <textarea
                placeholder="Paste snippets of requirements here..."
                className="form-input"
                style={{ height: "100px", resize: "none" }}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
              disabled={generating}
            >
              {generating ? "Drafting with AI..." : "Generate Outreach Draft"}
              <Cpu size={18} className={generating ? "animate-spin" : ""} />
            </button>
          </form>
        </div>

        {/* Right Side Outputs panel */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Outreach Pitch</h2>
            {emailBody && (
              <button
                className="btn-secondary"
                style={{ padding: "8px 14px", fontSize: "13px", gap: "6px" }}
                onClick={handleCopyToClipboard}
              >
                {copied ? <Check size={16} color="var(--secondary)" /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy All"}
              </button>
            )}
          </div>

          {emailBody ? (
            <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="glass-card">
                <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--primary)" }}>Subject Line</p>
                <h3 style={{ marginTop: "4px", fontSize: "15px", color: "#fff" }}>{emailSubject}</h3>
              </div>

              <div className="glass-card" style={{ whiteSpace: "pre-line", fontSize: "13.5px", lineHeight: "1.6", height: "400px", overflowY: "auto", background: "rgba(0,0,0,0.1)" }}>
                {emailBody}
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              minHeight: "350px",
              color: "var(--text-secondary)",
              textAlign: "center",
              padding: "40px"
            }}>
              <Mail size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
              <h3>Pitch Template Empty</h3>
              <p style={{ marginTop: "6px" }}>Complete the target form specifications on the left panel to compose a customized pitch email draft.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
