import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  FileText, 
  MessageSquare, 
  Map, 
  Briefcase, 
  Mail, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  Shield, 
  Zap, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  Menu, 
  X 
} from "lucide-react";
import logoImg from "../assets/logo.png";

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    {
      icon: <FileText size={28} className="text-blue" />,
      title: "AI Resume Audit",
      description: "Upload your resume for a granular AI review. Instantly discover gap analyses, format scores, and customized resume-boosting recommendations.",
      color: "var(--primary)"
    },
    {
      icon: <MessageSquare size={28} />,
      title: "AI Mock Interviews",
      description: "Practice real-time interactive verbal interviews tailored to your target job profile. Get scored on delivery, technical accuracy, and domain mastery.",
      color: "#10B981"
    },
    {
      icon: <Map size={28} />,
      title: "Personalized Roadmap",
      description: "Obtain a comprehensive, custom roadmap generated from your current skills and target developer roles. Know exactly what to learn next.",
      color: "#EC4899"
    },
    {
      icon: <Briefcase size={28} />,
      title: "Smart Job Finder",
      description: "Search active development jobs tailored to your tech stack. Uncover hidden openings matching your profile using smart search signals.",
      color: "#8B5CF6"
    },
    {
      icon: <Mail size={28} />,
      title: "Outreach Copilot",
      description: "Create high-converting, personalized cold emails and LinkedIn messages using AI to land interviews directly with recruiters and hiring managers.",
      color: "#F59E0B"
    }
  ];

  const faqs = [
    {
      question: "How does the AI Mock Interview system work?",
      answer: "Our mock interviewer utilizes advanced NLP to conduct multi-turn conversational interviews based on your resume and target role. It analyzes your answers and creates an detailed evaluation scorecard highlighting your technical gaps."
    },
    {
      question: "Will my resume data remain private and secure?",
      answer: "Absolutely. All resume documents and personal details uploaded to DevPilot are encrypted and stored securely. We do not sell or share your data with third parties."
    },
    {
      question: "How accurate is the Resume Audit?",
      answer: "The Resume Audit is trained on thousands of successful tech resumes and recruiter checklists. It analyzes your keywords, formatting, impact metrics, and alignment with modern industry standards."
    },
    {
      question: "Is DevPilot free to use?",
      answer: "We offer a fully featured free tier to get started with resume auditing, roadmap building, and basic interviews. Premium features are available with scalable credits."
    }
  ];

  return (
    <div style={{
      background: "var(--bg-primary, #0A0E1A)",
      color: "var(--text-primary, #ffffff)",
      minHeight: "100vh",
      fontFamily: "'Inter', sans-serif",
      overflowX: "hidden",
      position: "relative"
    }}>
      {/* Floating Background Effects */}
      <div className="liquid-blob-container" style={{ pointerEvents: "none", zIndex: 0 }}>
        <div className="liquid-blob liquid-blob-1" style={{ opacity: 0.35 }}></div>
        <div className="liquid-blob liquid-blob-2" style={{ opacity: 0.25 }}></div>
      </div>

      {/* Navigation Header */}
      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        background: "rgba(10, 14, 26, 0.65)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-color, rgba(255,255,255,0.08))",
        zIndex: 100,
        height: "72px",
        display: "flex",
        alignItems: "center"
      }}>
        <div style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          {/* Logo Brand */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <img 
              src={logoImg} 
              alt="DevPilot Logo" 
              style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover" }} 
            />
            <span style={{
              fontSize: "20px",
              fontWeight: "800",
              background: "linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.03em"
            }}>DevPilot</span>
          </Link>

          {/* Desktop Nav Links */}
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }} className="desktop-nav">
            <a href="#features" style={{ color: "var(--text-secondary, #94a3b8)", textDecoration: "none", fontSize: "14px", fontWeight: "500", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#ffffff"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}>Features</a>
            <a href="#how-it-works" style={{ color: "var(--text-secondary, #94a3b8)", textDecoration: "none", fontSize: "14px", fontWeight: "500", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#ffffff"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}>How it Works</a>
            <a href="#faqs" style={{ color: "var(--text-secondary, #94a3b8)", textDecoration: "none", fontSize: "14px", fontWeight: "500", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#ffffff"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}>FAQs</a>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }} className="desktop-nav">
            <Link to="/login" style={{
              color: "var(--text-primary, #ffffff)",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "600",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
              background: "rgba(255,255,255,0.03)",
              transition: "0.2s"
            }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>Sign In</Link>
            <Link to="/login" style={{
              background: "linear-gradient(135deg, var(--primary, #4364F7) 0%, #6366f1 100%)",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "600",
              padding: "10px 22px",
              borderRadius: "8px",
              boxShadow: "0 4px 15px rgba(67, 100, 247, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "0.2s"
            }} onMouseEnter={e => e.currentTarget.style.opacity = "0.95"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              Get Started <ArrowRight size={15} />
            </Link>
          </div>

          {/* Mobile Menu Icon */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              cursor: "pointer"
            }}
            className="mobile-menu-btn"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div style={{
          position: "fixed",
          top: "72px",
          left: 0,
          right: 0,
          background: "rgba(10, 14, 26, 0.98)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-color, rgba(255,255,255,0.08))",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          zIndex: 99
        }}>
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#ffffff", textDecoration: "none", fontSize: "16px", fontWeight: "500" }}>Features</a>
          <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#ffffff", textDecoration: "none", fontSize: "16px", fontWeight: "500" }}>How it Works</a>
          <a href="#faqs" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#ffffff", textDecoration: "none", fontSize: "16px", fontWeight: "500" }}>FAQs</a>
          <div style={{ height: "1px", background: "rgba(255,255,255,0.1)" }} />
          <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} style={{
            color: "#ffffff",
            textDecoration: "none",
            fontSize: "15px",
            fontWeight: "600",
            textAlign: "center",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)"
          }}>Sign In</Link>
          <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} style={{
            background: "linear-gradient(135deg, var(--primary, #4364F7) 0%, #6366f1 100%)",
            color: "#ffffff",
            textDecoration: "none",
            fontSize: "15px",
            fontWeight: "600",
            textAlign: "center",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 15px rgba(67, 100, 247, 0.3)"
          }}>Get Started</Link>
        </div>
      )}

      {/* Hero Section */}
      <section style={{
        padding: "160px 24px 80px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
        zIndex: 1
      }}>
        {/* Sparkle Tag */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--primary-glow, rgba(67, 100, 247, 0.08))",
          border: "1px solid var(--border-color, rgba(67, 100, 247, 0.25))",
          padding: "6px 14px",
          borderRadius: "20px",
          marginBottom: "24px",
          animation: "pulse 2s infinite"
        }}>
          <Sparkles size={14} color="var(--primary, #4364F7)" />
          <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary, #4364f7)" }}>AI-Powered Career Platform</span>
        </div>

        <h1 style={{
          fontSize: "56px",
          fontWeight: "800",
          maxWidth: "850px",
          lineHeight: "1.15",
          letterSpacing: "-0.04em",
          marginBottom: "20px",
          background: "linear-gradient(135deg, #ffffff 0%, #c7d2fe 50%, #818cf8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }} className="hero-title">
          Steer Your Tech Career with AI Guidance
        </h1>

        <p style={{
          fontSize: "18px",
          color: "var(--text-secondary, #94a3b8)",
          maxWidth: "600px",
          lineHeight: "1.6",
          marginBottom: "40px"
        }}>
          Supercharge your interview prep, audits, and outreach. DevPilot automates resume reviews, verbal mock interviews, roadmap mapping, and recruiter outreach.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center", marginBottom: "64px" }}>
          <Link to="/login" style={{
            background: "linear-gradient(135deg, var(--primary, #4364F7) 0%, #6366f1 100%)",
            color: "#ffffff",
            textDecoration: "none",
            fontSize: "15px",
            fontWeight: "700",
            padding: "14px 32px",
            borderRadius: "10px",
            boxShadow: "0 6px 20px rgba(67, 100, 247, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "0.2s"
          }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            Start For Free <ArrowRight size={16} />
          </Link>
          <a href="#features" style={{
            color: "#ffffff",
            textDecoration: "none",
            fontSize: "15px",
            fontWeight: "700",
            padding: "14px 32px",
            borderRadius: "10px",
            border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
            background: "rgba(255,255,255,0.03)",
            transition: "0.2s"
          }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.transform = "none"; }}>
            Explore Features
          </a>
        </div>

        {/* Stats Strip */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "40px",
          width: "100%",
          maxWidth: "800px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid var(--border-color, rgba(255,255,255,0.06))",
          borderRadius: "16px",
          padding: "24px",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)"
        }} className="stats-grid">
          <div>
            <h3 style={{ fontSize: "32px", fontWeight: "800", color: "var(--primary, #4364F7)", margin: "0 0 4px 0" }}>94%</h3>
            <span style={{ fontSize: "12px", color: "var(--text-secondary, #94a3b8)", fontWeight: "600", textTransform: "uppercase" }}>Interview Confidence</span>
          </div>
          <div>
            <h3 style={{ fontSize: "32px", fontWeight: "800", color: "#10B981", margin: "0 0 4px 0" }}>10K+</h3>
            <span style={{ fontSize: "12px", color: "var(--text-secondary, #94a3b8)", fontWeight: "600", textTransform: "uppercase" }}>Resumes Audited</span>
          </div>
          <div>
            <h3 style={{ fontSize: "32px", fontWeight: "800", color: "#8B5CF6", margin: "0 0 4px 0" }}>5x</h3>
            <span style={{ fontSize: "12px", color: "var(--text-secondary, #94a3b8)", fontWeight: "600", textTransform: "uppercase" }}>Faster Hired</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{
        padding: "80px 24px",
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <h2 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "16px", letterSpacing: "-0.03em" }}>Unified Suite for Developers</h2>
          <p style={{ color: "var(--text-secondary, #94a3b8)", maxWidth: "550px", margin: "0 auto", lineHeight: "1.6" }}>
            DevPilot replaces disjointed career platforms. Everything you need to scale up your professional growth in one workspace.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px"
        }}>
          {features.map((f, i) => (
            <div 
              key={i} 
              className="glass-panel"
              style={{
                background: "var(--card-bg, rgba(255,255,255,0.02))",
                border: "1px solid var(--border-color, rgba(255,255,255,0.06))",
                borderRadius: "16px",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                transition: "0.3s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "var(--primary, #4364F7)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(67, 100, 247, 0.08)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.borderColor = "var(--border-color, rgba(255,255,255,0.06))";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                background: "rgba(255, 255, 255, 0.04)",
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: f.color || "var(--primary)"
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>{f.title}</h3>
              <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" style={{
        padding: "80px 24px",
        background: "rgba(255,255,255,0.01)",
        borderTop: "1px solid var(--border-color, rgba(255,255,255,0.04))",
        borderBottom: "1px solid var(--border-color, rgba(255,255,255,0.04))",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "16px" }}>Simple, 3-Step Success</h2>
            <p style={{ color: "var(--text-secondary, #94a3b8)", maxWidth: "500px", margin: "0 auto", lineHeight: "1.6" }}>
              Get verified, complete setup, and let our AI agents guide your career development.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "40px"
          }} className="steps-container">
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative" }}>
              <div style={{
                fontSize: "14px",
                fontWeight: "800",
                color: "var(--primary, #4364F7)",
                background: "var(--primary-glow, rgba(67, 100, 247, 0.08))",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border-color, rgba(67, 100, 247, 0.2))"
              }}>1</div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Create & Verify Profile</h3>
              <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
                Sign up with your credentials. Input your target tech stack, target developer role, and sync GitHub or LeetCode.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                fontSize: "14px",
                fontWeight: "800",
                color: "var(--primary, #4364F7)",
                background: "var(--primary-glow, rgba(67, 100, 247, 0.08))",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border-color, rgba(67, 100, 247, 0.2))"
              }}>2</div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Upload & Practice</h3>
              <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
                Upload your resume for real-time audit. Trigger interactive AI mock interviews and track score feedback.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                fontSize: "14px",
                fontWeight: "800",
                color: "var(--primary, #4364F7)",
                background: "var(--primary-glow, rgba(67, 100, 247, 0.08))",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border-color, rgba(67, 100, 247, 0.2))"
              }}>3</div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Automate Outreach</h3>
              <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
                Generate customized roadmaps and automatically draft cold recruiter emails to fast-track interview scheduling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" style={{
        padding: "80px 24px",
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <h2 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "16px" }}>Frequently Asked Questions</h2>
          <p style={{ color: "var(--text-secondary, #94a3b8)", lineHeight: "1.6" }}>
            Got questions? We have answers.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {faqs.map((faq, i) => {
            const isOpen = activeFaq === i;
            return (
              <div 
                key={i} 
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border-color, rgba(255,255,255,0.06))",
                  borderRadius: "12px",
                  overflow: "hidden",
                  transition: "0.2s"
                }}
              >
                <button
                  onClick={() => toggleFaq(i)}
                  style={{
                    width: "100%",
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "transparent",
                    border: "none",
                    color: "#ffffff",
                    cursor: "pointer",
                    textAlign: "left",
                    fontWeight: "600",
                    fontSize: "15px"
                  }}
                >
                  {faq.question}
                  {isOpen ? <ChevronUp size={18} color="var(--primary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
                </button>
                {isOpen && (
                  <div style={{
                    padding: "0 24px 20px 24px",
                    color: "var(--text-secondary, #94a3b8)",
                    fontSize: "14px",
                    lineHeight: "1.6"
                  }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Footer Block */}
      <section style={{
        padding: "100px 24px 60px 24px",
        textAlign: "center",
        borderTop: "1px solid var(--border-color, rgba(255,255,255,0.04))",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{
          maxWidth: "700px",
          margin: "0 auto",
          background: "linear-gradient(135deg, rgba(67, 100, 247, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)",
          border: "1px solid var(--border-color, rgba(67, 100, 247, 0.15))",
          borderRadius: "24px",
          padding: "56px 40px"
        }} className="cta-panel">
          <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "16px" }}>Ready to Take the Pilot Seat?</h2>
          <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "15px", lineHeight: "1.6", marginBottom: "32px", maxWidth: "480px", margin: "0 auto 32px auto" }}>
            Join thousands of developers audit-proofing their resumes, crushing technical interviews, and landing career-changing jobs.
          </p>
          <Link to="/login" style={{
            background: "linear-gradient(135deg, var(--primary, #4364F7) 0%, #6366f1 100%)",
            color: "#ffffff",
            textDecoration: "none",
            fontSize: "15px",
            fontWeight: "700",
            padding: "14px 36px",
            borderRadius: "10px",
            boxShadow: "0 6px 20px rgba(67, 100, 247, 0.4)",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px"
          }}>
            Get Started Instantly <ArrowRight size={16} />
          </Link>
        </div>

        <footer style={{
          marginTop: "80px",
          fontSize: "13px",
          color: "var(--text-secondary, #64748b)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          maxWidth: "1200px",
          margin: "80px auto 0 auto",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          paddingTop: "24px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img src={logoImg} alt="DevPilot Logo" style={{ width: "20px", height: "20px", borderRadius: "4px" }} />
            <span style={{ fontWeight: "700" }}>DevPilot</span>
          </div>
          <span>&copy; {new Date().getFullYear()} DevPilot. All rights reserved.</span>
        </footer>
      </section>
    </div>
  );
}
