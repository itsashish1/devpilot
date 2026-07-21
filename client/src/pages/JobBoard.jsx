import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { API_BASE_URL, AI_API_BASE_URL } from "../config";
import { Briefcase, MapPin, DollarSign, Calendar, Star, FileText, ChevronRight, Check, X, ShieldAlert, Cpu, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function JobBoard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const [selectedJob, setSelectedJob] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [savingApp, setSavingApp] = useState(false);
  const [appSaved, setAppSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs`);
      if (!res.ok) throw new Error("Failed to retrieve jobs database");
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs?refresh=true`);
      if (!res.ok) throw new Error("Failed to sync live jobs");
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenJob = async (job) => {
    setSelectedJob(job);
    setMatchDetails(null);
    setMatchError("");
    setMatching(true);
    setAppSaved(false);

    try {
      const payload = {
        job_description: `${job.title}\n${job.description}\nKeywords: ${job.tags?.join(", ")}`,
        skills: user?.profile?.skills || [],
      };

      const res = await fetch(`${AI_API_BASE_URL}/api/ai/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to compute matching analytics");
      const data = await res.json();
      setMatchDetails(data);
    } catch (err) {
      setMatchError("Could not retrieve AI score. Please check AI backend connections.");
    } finally {
      setMatching(false);
    }
  };

  const handleSaveApplication = async () => {
    if (!selectedJob) return;
    setSavingApp(true);
    setSaveError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobTitle: selectedJob.title,
          company: selectedJob.company,
          status: "SAVED",
          notes: "Saved from Job Finder deck.",
        }),
      });

      if (!res.ok) throw new Error("Could not save this job. Please try again.");
      setAppSaved(true);
    } catch (err) {
      setSaveError(err.message || "Failed to track application.");
    } finally {
      setSavingApp(false);
    }
  };

  const handleGoToOutreach = () => {
    if (!selectedJob) return;
    navigate("/outreach", {
      state: {
        jobTitle: selectedJob.title,
        company: selectedJob.company,
        jobDescription: selectedJob.description,
      },
    });
  };

  // Rough front-end overlap calculator for list view indicators
  const calculateLocalMatch = (jobTags) => {
    const userSkills = user?.profile?.skills || [];
    if (!userSkills.length || !jobTags?.length) return 50;
    
    const overlap = jobTags.filter(t => 
      userSkills.some(us => us.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(us.toLowerCase()))
    ).length;
    
    const pct = Math.round((overlap / Math.max(1, jobTags.length)) * 100);
    return Math.max(35, Math.min(95, pct + 20)); // baseline buffer
  };

  return (
    <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>Job Finder</h1>
          <p>Find technical openings matching your coding profiles, scored by compatibility.</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={handleRefreshJobs}
            className="btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderRadius: "8px", fontSize: "13px" }}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Sync Live Jobs
          </button>
          <span className="badge badge-secondary" style={{ padding: "8px 12px", borderRadius: "8px" }}>
            Target: {user?.profile?.targetRole || "All Positions"}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "#fca5a5", padding: "16px", borderRadius: "12px" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px", color: "var(--text-secondary)" }}>
          Loading listings...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
          {(() => {
            const targetRole = user?.profile?.targetRole || "";
            const techKeywords = [
              "software", "developer", "engineer", "frontend", "backend", "full-stack", "fullstack", 
              "programmer", "react", "node", "typescript", "javascript", "python", "java", "c++", 
              "devops", "cloud", "aws", "kubernetes", "docker", "ai", "machine learning", "ml", "data", "qa", 
              "testing", "ui", "ux", "mobile", "ios", "android", "coder", "sde"
            ];

            // 1. Filter out completely non-tech/unnecessary jobs
            const techJobs = jobs.filter(job => {
              const titleLower = job.title.toLowerCase();
              const tagsLower = (job.tags || []).map(t => t.toLowerCase());
              return techKeywords.some(kw => 
                titleLower.includes(kw) || 
                tagsLower.some(t => t.includes(kw))
              );
            });

            // 2. Filter by user's target role keywords
            let finalJobs = techJobs;
            if (targetRole && targetRole.trim() !== "") {
              const roleKeywords = targetRole.toLowerCase()
                .replace(/[^a-zA-Z0-9\s]/g, "")
                .split(/\s+/)
                .filter(w => w.length > 2);
                
              if (roleKeywords.length > 0) {
                finalJobs = techJobs.filter(job => {
                  const titleLower = job.title.toLowerCase();
                  const descLower = job.description.toLowerCase();
                  const tagsLower = (job.tags || []).map(t => t.toLowerCase());
                  return roleKeywords.some(kw => 
                    titleLower.includes(kw) || 
                    descLower.includes(kw) || 
                    tagsLower.some(t => t.includes(kw))
                  );
                });
              }
            }

            // Fallback to all tech jobs if target filtering yields zero results
            const jobsToRender = finalJobs.length > 0 ? finalJobs : techJobs;

            return jobsToRender.map((job) => {
              const score = calculateLocalMatch(job.tags);
              return (
              <div
                key={job.id}
                className="glass-panel"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "between",
                  height: "320px",
                  cursor: "pointer",
                  position: "relative"
                }}
                onClick={() => handleOpenJob(job)}
              >
                {/* Match indicator badge top-right */}
                <div style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "var(--primary-glow)",
                  color: "var(--primary)",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "500"
                }}>
                  {score}% Match
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "18px", color: "var(--text-primary)", paddingRight: "70px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {job.title}
                  </h3>
                  <p style={{ color: "var(--primary)", fontWeight: "600", fontSize: "14px", marginTop: "4px" }}>{job.company}</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>
                      <MapPin size={14} />
                      {job.location}
                    </div>
                    {job.salary && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>
                        <DollarSign size={14} />
                        {job.salary}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
                    {job.tags?.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="badge badge-primary" style={{ fontSize: "10px" }}>{tag}</span>
                    ))}
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Audit Compatibility</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {job.url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(job.url, "_blank", "noopener,noreferrer");
                          }}
                          className="btn-secondary"
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-primary)"
                          }}
                        >
                          View Site
                        </button>
                      )}
                      <ChevronRight size={18} color="var(--primary)" />
                    </div>
                  </div>
                </div>
              </div>
            );
          });
        })()}
        </div>
      )}

      {/* Details Modal */}
      {selectedJob && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div className="glass-panel animate-fade" style={{ width: "100%", maxWidth: "680px", maxHeight: "85vh", overflowY: "auto", position: "relative" }}>
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedJob(null)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer"
              }}
            >
              <X size={24} />
            </button>

            <h2>{selectedJob.title}</h2>
            <p style={{ color: "var(--primary)", fontWeight: "600", fontSize: "16px", marginTop: "-12px", marginBottom: "20px" }}>{selectedJob.company}</p>

            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "24px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}><MapPin size={16} />{selectedJob.location}</span>
              {selectedJob.salary && <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}><DollarSign size={16} />{selectedJob.salary}</span>}
            </div>

            {/* AI Analyzer Panel */}
            <div className="glass-card" style={{ marginBottom: "24px", borderLeft: "2px solid var(--primary)", background: "var(--panel-bg)" }}>
              {matching ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px" }}>
                  <Cpu className="animate-spin" size={16} color="var(--primary)" />
                  <p>AI Career Agent is evaluating compatibility score...</p>
                </div>
              ) : matchError ? (
                <p style={{ color: "#fca5a5" }}>{matchError}</p>
              ) : matchDetails ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3>AI Matching Evaluation</h3>
                    <span className="badge badge-primary" style={{ fontSize: "12px" }}>
                      {matchDetails.match_score}% Match
                    </span>
                  </div>

                  {/* Skills lists */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)" }}>Matching Skills</p>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                        {matchDetails.matching_skills?.map((sk, idx) => (
                          <span key={idx} className="badge badge-secondary" style={{ fontSize: "10px" }}>{sk}</span>
                        ))}
                        {(!matchDetails.matching_skills || matchDetails.matching_skills.length === 0) && <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>None detected</span>}
                      </div>
                    </div>

                    <div>
                      <p style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)" }}>Missing Gaps</p>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                        {matchDetails.missing_skills?.map((sk, idx) => (
                          <span key={idx} className="badge" style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", fontSize: "10px" }}>{sk}</span>
                        ))}
                        {(!matchDetails.missing_skills || matchDetails.missing_skills.length === 0) && <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>None</span>}
                      </div>
                    </div>
                  </div>

                  {/* Preparation tip */}
                  <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-color)", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
                    <strong>Prep Tip: </strong>{matchDetails.preparation_tips}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Description */}
            <div style={{ marginBottom: "28px" }}>
              <h3>Job Description</h3>
              <p style={{ color: "var(--text-primary)", fontSize: "14px", marginTop: "8px", whiteSpace: "pre-line", lineHeight: "1.6" }}>
                {selectedJob.description}
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "16px", borderTop: "1px solid var(--border-color)", paddingTop: "20px", flexDirection: "column" }}>
              {saveError && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "#fca5a5", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
                  {saveError}
                </div>
              )}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  className="btn-primary"
                  onClick={handleGoToOutreach}
                >
                  Outreach Copilot
                </button>
                
                <button
                  className="btn-secondary"
                  onClick={handleSaveApplication}
                  disabled={savingApp || appSaved}
                >
                  {savingApp ? "Saving..." : appSaved ? "Job Saved ✓" : "Track Application"}
                </button>

                {selectedJob.url && (
                  <button
                    className="btn-secondary"
                    onClick={() => window.open(selectedJob.url, "_blank", "noopener,noreferrer")}
                  >
                    View Site
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
