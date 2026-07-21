import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../App";
import { AI_API_BASE_URL } from "../config";
import { MessageSquare, Play, RefreshCw, Send, CheckCircle2, AlertCircle, Award, Target, HelpCircle, ArrowLeft } from "lucide-react";

export default function MockInterview() {
  const { token, user } = useAuth();

  // Settings
  const [company, setCompany] = useState("Google");
  const [customCompany, setCustomCompany] = useState("");
  const [interviewType, setInterviewType] = useState("Technical");
  const [targetRole, setTargetRole] = useState(user?.profile?.targetRole || "Software Developer");
  
  // States
  const [chatStarted, setChatStarted] = useState(false);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Evaluation
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const messagesEndRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, loading]);

  const activeCompany = company === "Custom" ? customCompany || "Tech Company" : company;

  const handleStartInterview = async () => {
    setChatStarted(true);
    setHistory([]);
    setEvaluation(null);
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${AI_API_BASE_URL}/api/ai/interview/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: [],
          message: "",
          target_role: targetRole,
          skills: user?.profile?.skills || [],
          company: activeCompany,
          interview_type: interviewType,
          resume_text: user?.profile?.resumeText || ""
        })
      });

      if (!res.ok) throw new Error("Failed to start session.");
      const data = await res.json();
      setHistory([{ role: "assistant", content: data.response }]);
    } catch (err) {
      setError("Failed to connect to AI Agent. Starting offline simulation mode.");
      setHistory([{
        role: "assistant",
        content: `Welcome to your mock ${interviewType} interview for ${targetRole} at ${activeCompany}! Could you tell me about yourself and outline a major technical project you built recently?`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || loading) return;

    const userMsg = message.trim();
    const updatedHistory = [...history, { role: "user", content: userMsg }];
    setHistory(updatedHistory);
    setMessage("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${AI_API_BASE_URL}/api/ai/interview/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: updatedHistory,
          message: "",
          target_role: targetRole,
          skills: user?.profile?.skills || [],
          company: activeCompany,
          interview_type: interviewType,
          resume_text: user?.profile?.resumeText || ""
        })
      });

      if (!res.ok) throw new Error("Failed to fetch response.");
      const data = await res.json();
      setHistory([...updatedHistory, { role: "assistant", content: data.response }]);
    } catch (err) {
      // offline simulation fallback — do NOT call setLoading(false) here;
      // finally block handles it to avoid double execution.
      const turns = updatedHistory.filter(h => h.role === "user").length;
      let nextReply = "";
      if (turns === 1) {
        nextReply = "That's a very solid background. Let's dive deeper. Can you explain how you designed the database schema or data flow for that project? Specifically, how did you handle query performance or scaling limits?";
      } else if (turns === 2) {
        nextReply = "Good answer. Now, let's talk about performance optimization. If you noticed a sudden latency spike in your application, how would you systematically diagnose it? Mention any tools or metrics you'd inspect.";
      } else if (turns === 3) {
        nextReply = "Excellent debugging approach. Now, let's move to a behavioral scenario. Tell me about a time you had a major disagreement with a team member or product manager about technical decisions. How did you handle it?";
      } else {
        nextReply = "Great response! That covers all the main topics I wanted to check today. I will wrap up the interview now. You can click on 'End and Evaluate' to see your comprehensive performance scorecard.";
      }
      setTimeout(() => {
        setHistory([...updatedHistory, { role: "assistant", content: nextReply }]);
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    setError("");

    try {
      const res = await fetch(`${AI_API_BASE_URL}/api/ai/interview/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history,
          target_role: targetRole,
          skills: user?.profile?.skills || [],
          company: activeCompany,
          interview_type: interviewType
        })
      });

      if (!res.ok) throw new Error("Failed to evaluate conversation.");
      const data = await res.json();
      setEvaluation(data);
    } catch (err) {
      // Offline fallback evaluation
      const strengths = [
        `Demonstrated clear understanding of core concepts in ${user?.profile?.skills?.[0] || 'software engineering'}.`,
        "Presented structural approach to system design and latency spikes.",
        "Good communication style and logical explanation flow."
      ];
      const gaps = [
        "Could elaborate more on specific metrics, profiling tools, and telemetry.",
        "Explain the trade-offs of chosen database designs or frameworks more explicitly.",
        "Behavioral answers could follow the STAR framework (Situation, Task, Action, Result) more closely."
      ];
      const sample = [
        "When explaining projects, start with the business goal, highlight the technical challenges, and detail your contribution.",
        "Latency spikes: Mention system metrics like CPU saturation, memory leaks, connection pool exhaustion, and slow queries.",
        "Conflict resolution: Focus on objective data, active listening, and arriving at consensus through proof-of-concepts."
      ];
      setEvaluation({
        score: history.length >= 8 ? 85 : 72,
        summary: `You showed solid familiarity with the technical requirements of the ${targetRole} role. Communication was clear, but technical details could be deeper.`,
        strengths,
        gaps,
        sample_answers: sample
      });
    } finally {
      setEvaluating(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "var(--success)";
    if (score >= 60) return "var(--primary)";
    return "var(--error)";
  };

  return (
    <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: "32px", height: "100%", minHeight: "80vh" }}>
      <div>
        <h1>AI Mock Interview Simulator</h1>
        <p>Conduct realistic, interactive mock interviews tailored to target companies and roles. Receive dynamic scorecard feedback instantly.</p>
      </div>

      {error && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "#fca5a5", padding: "16px", borderRadius: "12px", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {!chatStarted ? (
        // SETUP CONFIGURATION VIEW
        <div className="glass-panel animate-slide-up shimmer-card" style={{ maxWidth: "600px", margin: "20px auto", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "var(--primary-glow)", padding: "12px", borderRadius: "12px" }}>
              <MessageSquare size={24} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>Configure Interview Session</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>Set up your mock parameters before launching the simulator</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
            <div className="grid-2" style={{ gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Target Company</label>
                <select className="form-input" value={company} onChange={(e) => setCompany(e.target.value)} style={{ padding: "11px" }}>
                  <option value="Google">Google</option>
                  <option value="Meta">Meta</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Netflix">Netflix</option>
                  <option value="Stripe">Stripe</option>
                  <option value="Custom">Custom / Other</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Interview Type</label>
                <select className="form-input" value={interviewType} onChange={(e) => setInterviewType(e.target.value)} style={{ padding: "11px" }}>
                  <option value="Technical">Technical & Coding</option>
                  <option value="System Design">System Design</option>
                  <option value="Behavioral">Behavioral (STAR)</option>
                </select>
              </div>
            </div>

            {company === "Custom" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Enter Custom Company Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Airbnb, Microsoft"
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Target Role</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Senior Frontend Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>

            <div className="glass-card" style={{ padding: "14px 18px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.01)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600" }}>
                <Target size={16} color="var(--primary)" />
                Skills & Resume Context Loaded
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>
                {user?.profile?.skills?.length ? `Using ${user.profile.skills.length} skills: ${user.profile.skills.slice(0, 5).join(", ")}...` : "No skills found. Update profile settings to supply core tech stacks."}
              </p>
            </div>
          </div>

          <button onClick={handleStartInterview} className="btn-primary" style={{ justifyContent: "center", padding: "12px", width: "100%", marginTop: "12px" }}>
            <Play size={18} />
            Start Mock Interview Session
          </button>
        </div>
      ) : (
        // INTERACTIVE CHAT SCREEN
        <div className="mock-interview-grid">
          {/* Side panel configs */}
          <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "20px", height: "fit-content" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700" }}>Session Metadata</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: "600" }}>COMPANY</span>
                <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{activeCompany}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: "600" }}>ROLE</span>
                <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{targetRole}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px", fontWeight: "600" }}>INTERVIEW TYPE</span>
                <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{interviewType}</span>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "8px 0" }} />

            {!evaluation && (
              <button 
                onClick={handleEvaluate} 
                className="btn-primary" 
                style={{ width: "100%", justifyContent: "center" }}
                disabled={evaluating || history.length < 2}
              >
                {evaluating ? "Evaluating..." : "End & Evaluate"}
                <Award size={18} />
              </button>
            )}

            <button 
              onClick={() => setChatStarted(false)} 
              className="btn-secondary" 
              style={{ width: "100%", justifyContent: "center" }}
            >
              <ArrowLeft size={16} />
              Exit Interview
            </button>
          </div>

          {/* Chat / Evaluation pane */}
          <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "20px", minHeight: "400px", flexGrow: 1, position: "relative" }}>
            {evaluation ? (
              // REPORT CARD VIEW
              <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto", paddingRight: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h2>Interview Evaluation</h2>
                  <button onClick={handleStartInterview} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>
                    <RefreshCw size={14} />
                    Restart Session
                  </button>
                </div>

                <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "24px", padding: "24px" }}>
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    border: `7px solid rgba(255,255,255,0.05)`,
                    borderTopColor: getScoreColor(evaluation.score),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    fontWeight: "800",
                    color: getScoreColor(evaluation.score)
                  }}>
                    {evaluation.score}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px" }}>Performance Score</h3>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>{evaluation.summary}</p>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <h4 style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--success)", fontSize: "14px", fontWeight: "700" }}>
                      <CheckCircle2 size={16} /> Strengths
                    </h4>
                    {evaluation.strengths?.map((item, idx) => (
                      <div key={idx} className="glass-card" style={{ padding: "12px 14px", fontSize: "13px" }}>{item}</div>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <h4 style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--warning)", fontSize: "14px", fontWeight: "700" }}>
                      <AlertCircle size={16} /> Areas of Improvement
                    </h4>
                    {evaluation.gaps?.map((item, idx) => (
                      <div key={idx} className="glass-card" style={{ padding: "12px 14px", fontSize: "13px" }}>{item}</div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <h4 style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--primary)", fontSize: "14px", fontWeight: "700" }}>
                    <HelpCircle size={16} /> Key Recommendations / Sample Answers
                  </h4>
                  {evaluation.sample_answers?.map((item, idx) => (
                    <div key={idx} className="glass-card" style={{ padding: "12px 14px", fontSize: "13px" }}>{item}</div>
                  ))}
                </div>
              </div>
            ) : (
              // ACTIVE CHAT BUBBLES VIEW
              <>
                <div style={{ flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", paddingRight: "8px", maxHeight: "60vh" }}>
                  {history.map((msg, idx) => {
                    const isInterviewer = msg.role === "assistant";
                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          display: "flex", 
                          justifyContent: isInterviewer ? "flex-start" : "flex-end",
                          width: "100%"
                        }}
                      >
                        <div style={{
                          maxWidth: "80%",
                          padding: "12px 16px",
                          borderRadius: "14px",
                          borderTopLeftRadius: isInterviewer ? "2px" : "14px",
                          borderTopRightRadius: isInterviewer ? "14px" : "2px",
                          background: isInterviewer ? "var(--card-bg)" : "var(--primary-glow)",
                          border: isInterviewer ? "1px solid var(--border-color)" : "1px solid rgba(59, 130, 246, 0.25)",
                          color: "var(--text-primary)",
                          fontSize: "13.5px",
                          lineHeight: "1.5"
                        }}>
                          {isInterviewer && (
                            <span style={{ display: "block", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--primary)", marginBottom: "4px" }}>
                              {activeCompany} Interviewer
                            </span>
                          )}
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}

                  {loading && (
                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                      <div style={{
                        padding: "12px 16px",
                        borderRadius: "14px",
                        borderTopLeftRadius: "2px",
                        background: "var(--card-bg)",
                        border: "1px solid var(--border-color)",
                        color: "var(--text-secondary)",
                        fontSize: "13px"
                      }}>
                        Interviewer is typing...
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "10px", borderTop: "1px solid var(--border-color)", paddingTop: "14px" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type your response here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                    style={{ flexGrow: 1 }}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: "10px 18px" }} disabled={loading || !message.trim()}>
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
