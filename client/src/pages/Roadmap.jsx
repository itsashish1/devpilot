import React, { useState } from "react";
import { useAuth } from "../App";
import { MapPin, CheckSquare, Square, ChevronRight, BookOpen, Star, HelpCircle } from "lucide-react";

export default function Roadmap() {
  const { user } = useAuth();
  const [completedTopics, setCompletedTopics] = useState({});

  const toggleTopic = (phaseIdx, topic) => {
    const key = `${phaseIdx}-${topic}`;
    setCompletedTopics((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getRoadmapData = () => {
    if (user?.profile?.analysisResult) {
      try {
        const parsed = JSON.parse(user.profile.analysisResult);
        return {
          roadmap: parsed.learning_roadmap || [],
          trending: parsed.trending_suggestions || [],
        };
      } catch (e) {}
    }
    return { roadmap: [], trending: [] };
  };

  const { roadmap, trending } = getRoadmapData();

  return (
    <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div>
        <h1>AI Personalized Roadmap</h1>
        <p>Interactive step-by-step custom curriculum curated specifically to bridge your engineering skill gaps.</p>
      </div>

      {roadmap.length > 0 ? (
        <div className="roadmap-grid">
          
          {/* Timeline section */}
          <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h2>Learning Pathway</h2>

            <div style={{ position: "relative", paddingLeft: "32px", display: "flex", flexDirection: "column", gap: "32px" }}>
              
              {/* Vertical timeline line */}
              <div style={{
                position: "absolute",
                left: "11px",
                top: "14px",
                bottom: "14px",
                width: "2px",
                background: "var(--border-color)"
              }}></div>

              {roadmap.map((phase, pIdx) => {
                // Calculate completion pct of phase
                const phaseTopics = phase.topics || [];
                const doneCount = phaseTopics.filter(t => completedTopics[`${pIdx}-${t}`]).length;
                const pct = phaseTopics.length ? Math.round((doneCount / phaseTopics.length) * 100) : 0;

                return (
                  <div key={pIdx} style={{ position: "relative" }}>
                    
                    {/* Timeline bullet */}
                    <div style={{
                      position: "absolute",
                      left: "-32px",
                      top: "6px",
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      background: pct === 100 ? "var(--primary)" : "var(--bg-color)",
                      border: `2px solid ${pct === 100 ? "var(--primary)" : "var(--border-color)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "var(--transition)"
                    }}>
                    </div>

                    {/* Phase Card */}
                    <div className="glass-card" style={{ padding: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <h3 style={{ fontSize: "16px", color: "var(--text-primary)", fontWeight: "600" }}>{phase.phase}</h3>
                          <p style={{ fontSize: "12px", marginTop: "2px" }}>Duration: <strong>{phase.estimated_weeks} Weeks</strong></p>
                        </div>
                        <span className="badge badge-primary">
                          {pct}% Complete
                        </span>
                      </div>

                      {/* List of study items */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                        {phaseTopics.map((topic, tIdx) => {
                          const isDone = !!completedTopics[`${pIdx}-${topic}`];
                          return (
                            <div
                              key={tIdx}
                              onClick={() => toggleTopic(pIdx, topic)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                background: isDone ? "var(--primary-glow)" : "transparent",
                                border: "1px solid var(--border-color)",
                                cursor: "pointer",
                                transition: "var(--transition)"
                              }}
                            >
                              {isDone ? (
                                <CheckSquare size={14} color="var(--primary)" />
                              ) : (
                                <Square size={14} color="var(--text-secondary)" />
                              )}
                              <span style={{
                                fontSize: "13px",
                                color: isDone ? "var(--text-secondary)" : "var(--text-primary)",
                                textDecoration: isDone ? "line-through" : "none"
                              }}>
                                {topic}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side panel: Trending & Industry hot topics */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Hot Topics */}
            <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Star size={20} color="var(--accent)" />
                Trending Topics
              </h2>
              <p>Hot, in-demand technical standards matching target markets.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {trending.map((item, idx) => (
                  <div key={idx} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <h3 style={{ color: "var(--accent)", fontSize: "14px" }}>{item.topic}</h3>
                    <p style={{ fontSize: "12px", lineHeight: "1.4" }}>{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick tips */}
            <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <HelpCircle size={18} color="var(--primary)" />
                Learning Resources
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "1.4" }}>
                Find free channels (freeCodeCamp, roadmap.sh, MDN) corresponding to these phases. Complete nodes one-by-one to boost resume fits.
              </p>
            </div>

          </div>

        </div>
      ) : (
        <div className="glass-panel" style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          color: "var(--text-secondary)",
          textAlign: "center"
        }}>
          <BookOpen size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
          <h3>No Roadmap Available</h3>
          <p style={{ maxWidth: "450px", marginTop: "6px" }}>
            Go to the **Resume Audit** page, paste your resume details, and run the AI analyzer. The career agent will construct a learning roadmap.
          </p>
        </div>
      )}
    </div>
  );
}
