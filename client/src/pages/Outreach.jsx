import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { AI_API_BASE_URL } from "../config";
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
  const [outreachType, setOutreachType] = useState("email"); // "email", "linkedin_note", or "linkedin_message"

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
        outreach_type: outreachType
      };

      const res = await fetch(`${AI_API_BASE_URL}/api/ai/cold-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to generate custom outreach draft");

      const data = await res.json();
      setEmailSubject(data.email_subject || "");
      setEmailBody(data.email_body);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    const fullText = outreachType === "email" ? `Subject: ${emailSubject}\n\n${emailBody}` : emailBody;
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

      <div className="grid-2" style={{ zIndex: 1, position: "relative" }}>
        {/* Left Side Inputs Form */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2>Target Specifications</h2>

          {/* Format Selector Tab */}
          <div style={{
            display: "flex",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-color)",
            borderRadius: "10px",
            padding: "4px",
            marginBottom: "10px"
          }}>
            <button
              type="button"
              onClick={() => { setOutreachType("email"); setEmailBody(""); setEmailSubject(""); }}
              style={{
                flex: 1,
                background: outreachType === "email" ? "var(--primary)" : "transparent",
                color: outreachType === "email" ? "#ffffff" : "var(--text-secondary)",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "12px",
                transition: "var(--transition)"
              }}
            >
              Email Pitch
            </button>
            <button
              type="button"
              onClick={() => { setOutreachType("linkedin_note"); setEmailBody(""); setEmailSubject(""); }}
              style={{
                flex: 1,
                background: outreachType === "linkedin_note" ? "var(--primary)" : "transparent",
                color: outreachType === "linkedin_note" ? "#ffffff" : "var(--text-secondary)",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "12px",
                transition: "var(--transition)"
              }}
            >
              LinkedIn Note
            </button>
            <button
              type="button"
              onClick={() => { setOutreachType("linkedin_message"); setEmailBody(""); setEmailSubject(""); }}
              style={{
                flex: 1,
                background: outreachType === "linkedin_message" ? "var(--primary)" : "transparent",
                color: outreachType === "linkedin_message" ? "#ffffff" : "var(--text-secondary)",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "12px",
                transition: "var(--transition)"
              }}
            >
              LinkedIn DM
            </button>
          </div>

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
            {emailBody && outreachType === "email" && (
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
              {outreachType === "email" && (
                <>
                  <div className="glass-card">
                    <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--primary)" }}>Subject Line</p>
                    <h3 style={{ marginTop: "4px", fontSize: "15px", color: "#fff" }}>{emailSubject}</h3>
                  </div>

                  <div className="glass-card" style={{ whiteSpace: "pre-line", fontSize: "13.5px", lineHeight: "1.6", height: "400px", overflowY: "auto", background: "rgba(8, 11, 17, 0.55)" }}>
                    {emailBody}
                  </div>
                </>
              )}

              {outreachType === "linkedin_note" && (
                <div className="linkedin-sim-card animate-fade">
                  <div className="linkedin-sim-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ background: "#0A66C2", width: "8px", height: "8px", borderRadius: "50%" }}></div>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#FFFFFF" }}>Invite connection note</span>
                    </div>
                    <span className="linkedin-badge">LinkedIn Invite</span>
                  </div>

                  <div className="linkedin-sim-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: 0 }}>
                      Personalize your invitation note to connect (300 character limit).
                    </p>

                    <textarea
                      className="linkedin-sim-textarea"
                      rows={5}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      maxLength={300}
                    />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ 
                        fontSize: "12px", 
                        color: emailBody.length >= 300 ? "var(--error)" : "rgba(255,255,255,0.5)",
                        fontWeight: emailBody.length >= 300 ? "600" : "400"
                      }}>
                        {emailBody.length} / 300 characters
                      </span>
                      <button 
                        type="button" 
                        className="btn-linkedin"
                        onClick={handleCopyToClipboard}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? "Copied Note" : "Copy Note"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {outreachType === "linkedin_message" && (
                <div className="linkedin-sim-card animate-fade">
                  <div className="linkedin-sim-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ background: "#059669", width: "8px", height: "8px", borderRadius: "50%" }}></div>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#FFFFFF" }}>Direct Message</span>
                    </div>
                    <span className="linkedin-badge">LinkedIn DM</span>
                  </div>

                  <div className="linkedin-sim-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <div style={{ 
                        background: "linear-gradient(135deg, #0A66C2 0%, #004182 100%)", 
                        width: "36px", 
                        height: "36px", 
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "13px",
                        color: "#FFFFFF",
                        boxShadow: "0 2px 8px rgba(10, 102, 194, 0.4)",
                        flexShrink: 0
                      }}>
                        {userName.substring(0, 2).toUpperCase()}
                      </div>

                      <div style={{
                        background: "#293138",
                        borderRadius: "0 12px 12px 12px",
                        padding: "14px 18px",
                        flex: 1,
                        border: "1px solid rgba(255, 255, 255, 0.05)"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "600", color: "#FFFFFF" }}>{userName}</span>
                          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>Draft</span>
                        </div>
                        <textarea
                          className="linkedin-sim-textarea"
                          style={{ background: "transparent", border: "none", padding: 0, fontSize: "13.5px", boxShadow: "none" }}
                          rows={8}
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button 
                        type="button" 
                        className="btn-linkedin"
                        onClick={handleCopyToClipboard}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? "Copied Message" : "Copy DM"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
              <p style={{ marginTop: "6px" }}>
                {outreachType === "email" && "Complete the target form specifications on the left panel to compose a customized pitch email draft."}
                {outreachType === "linkedin_note" && "Complete the target form specifications on the left panel to compose a customized LinkedIn connection note."}
                {outreachType === "linkedin_message" && "Complete the target form specifications on the left panel to compose a customized LinkedIn direct message."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
