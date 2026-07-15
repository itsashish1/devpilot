import os
import json
from typing import TypedDict, List, Dict, Any
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END

# Try importing LangChain libraries; will fall back to rule-based parser if keys/deps missing
try:
  from langchain_google_genai import ChatGoogleGenerativeAI
  from langchain_core.messages import SystemMessage, HumanMessage
  HAS_LANGCHAIN = True
except ImportError:
  HAS_LANGCHAIN = False

load_dotenv()

# Define the State Schema for the Career Agent
class AgentState(TypedDict):
    resume_text: str
    github_languages: List[str]
    leetcode_solved: int
    target_role: str
    skills: List[str]
    
    # Outputs to populate
    resume_score: int
    resume_feedback: List[str]
    learning_roadmap: List[Dict[str, Any]]
    trending_suggestions: List[Dict[str, Any]]

# Node 1: Synthesize and clean user inputs
def synthesize_profile(state: AgentState) -> Dict[str, Any]:
    skills = state.get("skills", [])
    languages = state.get("github_languages", [])
    
    # Deduplicate and combine detected skills
    all_skills = list(set([s.lower().strip() for s in skills] + [l.lower().strip() for l in languages]))
    
    return {
        "skills": all_skills
    }

# Node 2: Analyze resume text and calculate details
def analyze_resume(state: AgentState) -> Dict[str, Any]:
    resume_text = state.get("resume_text", "")
    target_role = state.get("target_role", "Software Engineer")
    
    from llm import query_llm
    try:
        prompt = (
            f"You are an expert resume reviewer. Analyze this resume text for a '{target_role}' role.\n"
            f"Resume Text:\n{resume_text}\n\n"
            "Return a JSON object containing exactly two keys:\n"
            "1. 'resume_score' (an integer from 30 to 100 based on phrasing, structure, metrics, and fit for role).\n"
            "2. 'resume_feedback' (a list of 3-5 short actionable bullet points on how to improve the resume).\n"
            "Return only valid raw JSON without markdown code fences."
        )
        response_text = query_llm(
            prompt=prompt,
            system_prompt="You are a helpful career advisor. Return JSON only.",
            temperature=0.2
        )
        
        clean_content = response_text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_content)
        return {
            "resume_score": data.get("resume_score", 75),
            "resume_feedback": data.get("resume_feedback", [])
        }
    except Exception as e:
        print(f"LLM resume analysis failed: {e}. Falling back to rule-based analysis.")

    # Rule-based fallback
    score = 65
    feedback = []
    
    text_lower = resume_text.lower()
    if len(resume_text) < 100:
        feedback.append("Resume text appears extremely short. Add comprehensive details about projects and education.")
        score -= 20
    else:
        if "achieved" not in text_lower and "led" not in text_lower and "improved" not in text_lower:
            feedback.append("Use more action verbs (e.g., 'Led developer team', 'Optimized query efficiency by 30%') instead of passive phrasing.")
            score += 5
        if "%" not in text_lower and "percent" not in text_lower:
            feedback.append("Include quantifiable achievements (e.g., performance boosts, users reached, speed percentage improvements).")
            score += 5
        if "http" not in text_lower and "github.com" not in text_lower:
            feedback.append("Add links to your portfolio, GitHub, or live deployment projects to build credibility.")
            score += 10
            
    if target_role.lower() not in text_lower:
        feedback.append(f"Tailor your professional summary and skills section specifically for the '{target_role}' position.")
        score -= 5
        
    feedback.append("Organize your skills section into structured sections (e.g., Languages, Libraries, Databases) rather than a single list.")
    
    return {
        "resume_score": max(30, min(100, score)),
        "resume_feedback": feedback
    }

# Node 3: Create tailored roadmap
def create_roadmap(state: AgentState) -> Dict[str, Any]:
    skills = state.get("skills", [])
    target_role = state.get("target_role", "Software Engineer").lower()
    leetcode_solved = state.get("leetcode_solved", 0)
    
    from llm import query_llm
    try:
        prompt = (
            f"Generate a personalized career roadmap for a user aiming to be a '{target_role}'.\n"
            f"Their current skills: {', '.join(skills)}.\n"
            f"Their LeetCode solved problems: {leetcode_solved}.\n\n"
            "Return a JSON object containing exactly two keys:\n"
            "1. 'learning_roadmap' (a list of 3 sequential phases, where each phase is a dict containing 'phase' (name), 'topics' (list of topics to study), and 'estimated_weeks' (integer)).\n"
            "2. 'trending_suggestions' (a list of 2 dicts with keys 'topic' and 'reason' describing trending concepts they should learn based on gaps).\n"
            "Return only valid raw JSON without markdown code fences."
        )
        response_text = query_llm(
            prompt=prompt,
            system_prompt="You are a professional roadmap compiler. Return JSON only.",
            temperature=0.3
        )
        clean_content = response_text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_content)
        return {
            "learning_roadmap": data.get("learning_roadmap", []),
            "trending_suggestions": data.get("trending_suggestions", [])
        }
    except Exception as e:
        print(f"LLM roadmap creation failed: {e}. Falling back to rule-based logic.")
            
    # Rule-based fallback roadmap
    phases = []
    suggestions = []
    
    # Basic roadmap structure
    if "backend" in target_role or "full stack" in target_role or "fullstack" in target_role:
        phases.append({
            "phase": "Phase 1: Advanced DB & API Systems",
            "topics": ["DB Indexing", "Connection Pooling", "REST vs GraphQL", "TypeScript Interfaces"],
            "estimated_weeks": 3
        })
        phases.append({
            "phase": "Phase 2: System Design & Caching",
            "topics": ["Redis Caching", "Horizontal vs Vertical Scaling", "Load Balancers", "Docker Containerization"],
            "estimated_weeks": 4
        })
        phases.append({
            "phase": "Phase 3: CI/CD & Deployments",
            "topics": ["GitHub Actions", "Nginx Config", "Cloud Services (AWS/Render)", "Monitoring & Logging"],
            "estimated_weeks": 3
        })
        
        suggestions.append({
            "topic": "Vector Databases (PGVector/Pinecone)",
            "reason": "AI integrations are standard. Knowing vector embeddings will distinguish you in backend applications."
        })
        suggestions.append({
            "topic": "Serverless Functions (Supabase Edge / AWS Lambda)",
            "reason": "Modern backend development uses event-driven serverless architectures to minimize infrastructure costs."
        })
    else: # Default engineering roadmap
        phases.append({
            "phase": "Phase 1: Deep Dive into Framework Fundamentals",
            "topics": ["State Management (Zustand/Redux)", "Performance Profiling", "Advanced hooks", "TypeScript"],
            "estimated_weeks": 3
        })
        phases.append({
            "phase": "Phase 2: Building Fullstack integrations",
            "topics": ["FastAPI endpoints", "Prisma Postgres Setup", "JWT session validation", "CORS handling"],
            "estimated_weeks": 3
        })
        phases.append({
            "phase": "Phase 3: Optimization & Deployments",
            "topics": ["SEO Optimization", "Webpack/Vite bundling configurations", "Docker containers", "Testing (Vitest/Jest)"],
            "estimated_weeks": 4
        })
        
        suggestions.append({
            "topic": "TailwindCSS v4 & Design Tokens",
            "reason": "Speeding up UI iteration cycles is highly valued in frontend and startup environments."
        })
        suggestions.append({
            "topic": "Next.js App Router & Server Actions",
            "reason": "Unified frontend-backend codebases are trending, making fullstack delivery extremely fast."
        })
        
    if leetcode_solved < 100:
        phases[0]["topics"].append("DSA basics (Arrays, Hashing, Two Pointers)")
        suggestions.append({
            "topic": "Data Structures & Algorithms Consistency",
            "reason": "Since your LeetCode solved count is low, solving 2 questions daily will improve your technical interview clear rates."
        })

    return {
        "learning_roadmap": phases,
        "trending_suggestions": suggestions[:2] # Limit to 2 suggestions
    }

# Compile the LangGraph graph
builder = StateGraph(AgentState)

# Add nodes
builder.add_node("synthesize", synthesize_profile)
builder.add_node("analyze_resume", analyze_resume)
builder.add_node("create_roadmap", create_roadmap)

# Define edges
builder.set_entry_point("synthesize")
builder.add_edge("synthesize", "analyze_resume")
builder.add_edge("analyze_resume", "create_roadmap")
builder.add_edge("create_roadmap", END)

# Final compiled graph
career_agent = builder.compile()

def run_career_agent(
    resume_text: str,
    github_languages: List[str],
    leetcode_solved: int,
    target_role: str,
    skills: List[str]
) -> Dict[str, Any]:
    initial_state = {
        "resume_text": resume_text,
        "github_languages": github_languages,
        "leetcode_solved": leetcode_solved,
        "target_role": target_role,
        "skills": skills,
        "resume_score": 0,
        "resume_feedback": [],
        "learning_roadmap": [],
        "trending_suggestions": []
    }
    
    final_output = career_agent.invoke(initial_state)
    return {
        "resume_score": final_output["resume_score"],
        "resume_feedback": final_output["resume_feedback"],
        "learning_roadmap": final_output["learning_roadmap"],
        "trending_suggestions": final_output["trending_suggestions"]
    }
