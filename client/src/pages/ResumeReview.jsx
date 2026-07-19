import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../App";
import { API_BASE_URL, AI_API_BASE_URL } from "../config";
import { FileText, Cpu, AlertTriangle, CheckCircle, RefreshCw, BarChart2, History, Clock, ArrowLeft } from "lucide-react";

export default function ResumeReview() {
  const { token, user, refreshProfile } = useAuth();
  
  const [resumeText, setResumeText] = useState(user?.profile?.resumeText || "");
  const [analyzing, setAnalyzing] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
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

  const [history, setHistory] = useState([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile/audits`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch audit history:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setParsing(true);
    setError("");
    setUploadedFileName("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${AI_API_BASE_URL}/api/ai/parse-resume`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to parse document.");
      }

      const data = await res.json();
      setResumeText(data.text);
      setUploadedFileName(file.name);
    } catch (err) {
      setError(err.message || "Failed to parse file.");
      setUploadedFileName("");
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
      const saveRes = await fetch(`${API_BASE_URL}/api/profile`, {
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

      const aiRes = await fetch(`${AI_API_BASE_URL}/api/ai/analyze`, {
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
      await fetch(`${API_BASE_URL}/api/profile`, {
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
      fetchHistory();
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

  const displayResult = selectedHistoryItem
    ? (typeof selectedHistoryItem.analysisResult === "string" ? JSON.parse(selectedHistoryItem.analysisResult) : selectedHistoryItem.analysisResult)
    : result;

  const displayResumeText = selectedHistoryItem
    ? selectedHistoryItem.resumeText
    : resumeText;

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
            accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
            style={{ display: "none" }}
          />

          {/* File Upload Card */}
          <div style={{
            border: uploadedFileName ? "1px solid var(--success)" : "1px dashed var(--border-color)",
            borderRadius: "12px",
            padding: "24px",
            textAlign: "center",
            background: uploadedFileName 
              ? "rgba(16, 185, 129, 0.04)" 
              : selectedHistoryItem ? "rgba(255, 255, 255, 0.01)" : "rgba(255, 255, 255, 0.03)",
            cursor: selectedHistoryItem ? "not-allowed" : "pointer",
            transition: "var(--transition)"
          }}
          onClick={() => {
            if (selectedHistoryItem) return;
            if (fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
          onMouseOver={(e) => {
            if (!selectedHistoryItem) e.currentTarget.style.borderColor = "var(--border-hover)";
          }}
          onMouseOut={(e) => {
            if (!selectedHistoryItem) e.currentTarget.style.borderColor = uploadedFileName ? "var(--success)" : "var(--border-color)";
          }}
          >
            {uploadedFileName ? (
              <>
                <CheckCircle size={32} style={{ color: "var(--success)", marginBottom: "12px", margin: "0 auto" }} />
                <h3 style={{ fontSize: "14px", marginTop: "8px", color: "var(--success)", fontWeight: "600" }}>
                  Successfully Loaded
                </h3>
                <p style={{ fontSize: "12px", marginTop: "4px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "260px", margin: "4px auto 0" }}>
                  {uploadedFileName}
                </p>
                <span style={{ fontSize: "11px", color: "var(--primary)", textDecoration: "underline", display: "inline-block", marginTop: "8px", fontWeight: "500" }}>
                  Click to upload a different file
                </span>
              </>
            ) : (
              <>
                <FileText size={32} style={{ color: parsing ? "var(--primary)" : "var(--text-secondary)", marginBottom: "12px", margin: "0 auto" }} className={parsing ? "animate-pulse" : ""} />
                <h3 style={{ fontSize: "14px", marginTop: "8px" }}>
                  {parsing ? "Parsing Resume..." : selectedHistoryItem ? "Upload Disabled in History View" : "Upload Resume (PDF, Image, DOCX, TXT)"}
                </h3>
                <p style={{ fontSize: "12px", marginTop: "4px" }}>
                  {parsing ? "Extracting document content..." : selectedHistoryItem ? "Exit history mode to upload a new file" : "Click to select a document or image from your computer"}
                </p>
              </>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>
                Or Paste Plain Resume Text:
              </label>
              {selectedHistoryItem && (
                <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: "600" }}>
                  * Viewing History Snapshot
                </span>
              )}
            </div>
            <textarea
              className="form-input"
              style={{ 
                height: "240px", 
                resize: "none", 
                fontSize: "13px",
                background: "var(--input-bg)",
                cursor: selectedHistoryItem ? "not-allowed" : "text"
              }}
              placeholder="Paste work experience, project descriptions, skills, and summary here..."
              value={displayResumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                if (!e.target.value.trim()) {
                  setUploadedFileName("");
                }
              }}
              disabled={!!selectedHistoryItem}
            />
          </div>

          {selectedHistoryItem ? (
            <button
              onClick={() => setSelectedHistoryItem(null)}
              className="btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <ArrowLeft size={18} />
              Return to Current Draft
            </button>
          ) : (
            <button
              onClick={handleAnalyze}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={analyzing}
            >
              {analyzing ? "AI Agent is Analyzing..." : "Run AI Resume Audit"}
              <Cpu size={18} className={analyzing ? "animate-spin" : ""} />
            </button>
          )}
        </div>

        {/* Right Side: AI Critique Results */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <h2>AI Audit Report</h2>

          {displayResult ? (
            <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {selectedHistoryItem && (
                <div style={{
                  background: "var(--primary-glow)",
                  border: "1px solid rgba(37, 99, 235, 0.2)",
                  borderRadius: "6px",
                  padding: "10px 14px",
                  color: "var(--primary)",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontWeight: "500"
                }}>
                  <span>Viewing past audit ({new Date(selectedHistoryItem.createdAt).toLocaleDateString()})</span>
                  <button 
                    onClick={() => setSelectedHistoryItem(null)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--primary)",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: "12px",
                      textDecoration: "underline"
                    }}
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Score card */}
              <div className="glass-card" style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: "24px", padding: "24px", flexWrap: "wrap" }}>
                <div style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  border: `8px solid rgba(255,255,255,0.05)`,
                  borderTopColor: getScoreColor(displayResult.resume_score),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: "800",
                  color: getScoreColor(displayResult.resume_score)
                }}>
                  {displayResult.resume_score}
                </div>
                <div>
                  <h3>ATS Match Quality</h3>
                  <p style={{ margin: "4px 0" }}>Overall rating based on engineering standard standards.</p>
                  <span className="badge" style={{ background: `${getScoreColor(displayResult.resume_score)}20`, color: getScoreColor(displayResult.resume_score) }}>
                    {displayResult.resume_score >= 80 ? "Highly Optimised" : displayResult.resume_score >= 60 ? "Average Fit" : "Needs Rework"}
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
                  {displayResult.resume_feedback?.map((item, idx) => (
                    <div key={idx} className="glass-card" style={{ display: "flex", gap: "12px", padding: "12px 16px", alignItems: "flex-start" }}>
                      <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <p style={{ color: "var(--text-primary)", fontSize: "13px" }}>{item}</p>
                    </div>
                  ))}
                  {(!displayResult.resume_feedback || displayResult.resume_feedback.length === 0) && (
                    <div className="glass-card" style={{ display: "flex", gap: "12px", padding: "12px 16px" }}>
                      <CheckCircle size={18} color="var(--secondary)" />
                      <p style={{ color: "var(--text-primary)" }}>Resume details contain clean and actionable wording. Well done!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Suggestions summary */}
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "center", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                Analyzing for <strong>{displayResult.target_role || user?.profile?.targetRole || "Software Developer"}</strong>. Adjust your target role on the dashboard to recalculate fits.
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

      {/* History Section */}
      <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
          <History size={20} color="var(--primary)" />
          Resume Audit & Change History
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
          Track all changes, uploads, and ATS scores over time. Click on a past audit to inspect its details and recommendations.
        </p>

        {history.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", border: "1px dashed var(--border-color)", borderRadius: "6px", color: "var(--text-secondary)" }}>
            <Clock size={24} style={{ opacity: 0.4, marginBottom: "8px", margin: "0 auto" }} />
            <p style={{ fontSize: "13px" }}>No history found yet. Run an AI Audit to start tracking your progress.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }}>
            {history.map((item) => {
              let itemResult = null;
              try {
                itemResult = typeof item.analysisResult === "string" ? JSON.parse(item.analysisResult) : item.analysisResult;
              } catch (e) {
                // fallback
              }
              const dateStr = new Date(item.createdAt).toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });
              const score = itemResult?.resume_score || 0;
              const isCurrentView = selectedHistoryItem?.id === item.id;

              return (
                <div 
                  key={item.id} 
                  className="glass-card" 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    gap: "16px",
                    padding: "14px 20px",
                    borderColor: isCurrentView ? "var(--primary)" : "var(--border-color)",
                    background: isCurrentView ? "var(--primary-glow)" : "rgba(255, 255, 255, 0.02)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: `${getScoreColor(score)}15`,
                      color: getScoreColor(score),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "14px"
                    }}>
                      {score}
                    </div>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "14px", color: "var(--text-primary)" }}>
                        Analyzed for {itemResult?.target_role || user?.profile?.targetRole || "Software Developer"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={12} />
                        {dateStr}
                      </div>
                    </div>
                  </div>

                  <button
                    className={isCurrentView ? "btn-primary" : "btn-secondary"}
                    style={{ padding: "6px 14px", fontSize: "12px" }}
                    onClick={() => {
                      if (isCurrentView) {
                        setSelectedHistoryItem(null);
                      } else {
                        setSelectedHistoryItem(item);
                      }
                    }}
                  >
                    {isCurrentView ? "Viewing" : "View Report"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
