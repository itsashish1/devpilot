import React, { useState, useRef } from "react";
import { useAuth } from "../App";
import { FileText, Cpu, AlertTriangle, CheckCircle, RefreshCw, BarChart2 } from "lucide-react";

export default function ResumeReview() {
  const { token, user, refreshProfile } = useAuth();
  
  const [resumeText, setResumeText] = useState(user?.profile?.resumeText || "");
  const [analyzing, setAnalyzing] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState(() => {
    if (user?.profile?.analysisResult) {
      try {
        return JSON.parse(user.profile.analysisResult);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setParsing(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/ai/parse-resume", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to parse document.");
      }

      const data = await res.json();
      setResumeText(data.text);
    } catch (err) {
      setError(err.message || "Failed to parse file.");
    } finally {
      setParsing(false);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      setError("Please paste your resume text to analyze.");
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      // 1. Update the resumeText in Express database
      const saveRes = await fetch("http://localhost:5000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeText,
        }),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save resume details in core backend");
      }

      // 2. Call FastAPI LangGraph Agent to analyze
      const payload = {
        resume_text: resumeText,
        github_languages: user?.githubStats?.topLanguages || [],
        leetcode_solved: user?.leetcodeStats?.totalSolved || 0,
        target_role: user?.profile?.targetRole || "Software Developer",
        skills: user?.profile?.skills || [],
      };

      const aiRes = await fetch("http://localhost:8000/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!aiRes.ok) {
        throw new Error("AI Agent backend returned an error status.");
      }

      const aiData = await aiRes.json();
      setResult(aiData);

      // 3. Cache the analysis result back in Express Database
      await fetch("http://localhost:5000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          analysisResult: aiData,
        }),
      });

      refreshProfile();
    } catch (err) {
      setError(err.message || "Failed to analyze resume.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "var(--success)";
    if (score >= 60) return "var(--primary)";
    return "var(--error)";
  };

  return (
    <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div>
        <h1>Resume Audit Hub</h1>
        <p>Analyze your resume against ATS requirements and engineering job alignments instantly.</p>
      </div>

      {error && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "#fca5a5", padding: "16px", borderRadius: "12px", fontSize: "14px" }}>
          {error}
        </div>
      )}

      <div className="grid-2">
        {/* Left Side: Inputs */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2>Submit Resume</h2>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.doc,.txt"
            style={{ display: "none" }}
          />

          {/* File Upload Card */}
          <div style={{
            border: "1px dashed var(--border-color)",
            borderRadius: "6px",
            padding: "24px",
            textAlign: "center",
            background: "#FAFAFA",
            cursor: "pointer",
            transition: "var(--transition)"
          }}
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--border-hover)"}
          onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
          >
            <FileText size={32} style={{ color: parsing ? "var(--primary)" : "var(--text-secondary)", marginBottom: "12px", margin: "0 auto" }} className={parsing ? "animate-pulse" : ""} />
            <h3 style={{ fontSize: "14px", marginTop: "8px" }}>
              {parsing ? "Parsing Resume..." : "Upload Resume (PDF, DOCX, TXT)"}
            </h3>
            <p style={{ fontSize: "12px", marginTop: "4px" }}>
              {parsing ? "Extracting document content..." : "Click to select a document from your computer"}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>
              Or Paste Plain Resume Text:
            </label>
            <textarea
              className="form-input"
              style={{ height: "240px", resize: "none", fontSize: "13px" }}
              placeholder="Paste work experience, project descriptions, skills, and summary here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </div>

          <button
            onClick={handleAnalyze}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={analyzing}
          >
            {analyzing ? "AI Agent is Analyzing..." : "Run AI Resume Audit"}
            <Cpu size={18} className={analyzing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Right Side: AI Critique Results */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <h2>AI Audit Report</h2>

          {result ? (
            <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Score card */}
              <div className="glass-card" style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: "24px", padding: "24px" }}>
                <div style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  border: `8px solid rgba(255,255,255,0.05)`,
                  borderTopColor: getScoreColor(result.resume_score),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: "800",
                  color: getScoreColor(result.resume_score)
                }}>
                  {result.resume_score}
                </div>
                <div>
                  <h3>ATS Match Quality</h3>
                  <p style={{ margin: "4px 0" }}>Overall rating based on engineering standard standards.</p>
                  <span className="badge" style={{ background: `${getScoreColor(result.resume_score)}20`, color: getScoreColor(result.resume_score) }}>
                    {result.resume_score >= 80 ? "Highly Optimised" : result.resume_score >= 60 ? "Average Fit" : "Needs Rework"}
                  </span>
                </div>
              </div>

              {/* Feedback Points */}
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <BarChart2 size={18} color="var(--primary)" />
                  Key Actionable Suggestions
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {result.resume_feedback?.map((item, idx) => (
                    <div key={idx} className="glass-card" style={{ display: "flex", gap: "12px", padding: "12px 16px", alignItems: "flex-start" }}>
                      <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <p style={{ color: "var(--text-primary)", fontSize: "13px" }}>{item}</p>
                    </div>
                  ))}
                  {(!result.resume_feedback || result.resume_feedback.length === 0) && (
                    <div className="glass-card" style={{ display: "flex", gap: "12px", padding: "12px 16px" }}>
                      <CheckCircle size={18} color="var(--secondary)" />
                      <p style={{ color: "var(--text-primary)" }}>Resume details contain clean and actionable wording. Well done!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Suggestions summary */}
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "center", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                Analyzing for <strong>{user?.profile?.targetRole || "Software Developer"}</strong>. Adjust your target role on the dashboard to recalculate fits.
              </div>

            </div>
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: "40px",
              color: "var(--text-secondary)",
              textAlign: "center"
            }}>
              <FileText size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
              <h3>Report Pending</h3>
              <p style={{ marginTop: "6px" }}>Paste your resume text and run the AI analyzer to inspect ATS metrics, gaps, and improvements.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
