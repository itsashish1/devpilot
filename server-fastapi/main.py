import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from agent import run_career_agent

# Try importing LangChain libraries; will fall back to rules if keys/deps missing
try:
  from langchain_google_genai import ChatGoogleGenerativeAI
  from langchain_core.messages import SystemMessage, HumanMessage
  HAS_LANGCHAIN = True
except ImportError:
  HAS_LANGCHAIN = False

load_dotenv()

app = FastAPI(title="DevPilot AI Backend", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input Pydantic Schemas
class AnalysisRequest(BaseModel):
    resume_text: str
    github_languages: List[str]
    leetcode_solved: int
    target_role: str
    skills: List[str]

class MatchRequest(BaseModel):
    job_description: str
    skills: List[str]

class ColdEmailRequest(BaseModel):
    job_title: str
    company: str
    job_description: str
    resume_summary: Optional[str] = ""
    github_projects: Optional[List[str]] = None
    skills: List[str]
    user_name: str

@app.get("/")
def read_root():
    return {"message": "DevPilot AI Agent API is running", "status": "healthy"}

@app.post("/api/ai/analyze")
async def analyze_profile(req: AnalysisRequest):
    try:
        results = run_career_agent(
            resume_text=req.resume_text,
            github_languages=req.github_languages,
            leetcode_solved=req.leetcode_solved,
            target_role=req.target_role,
            skills=req.skills
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/match")
async def match_job(req: MatchRequest):
    user_skills = [s.lower().strip() for s in req.skills]
    
    from llm import query_llm
    try:
        prompt = (
            f"Compare the user's skills with this job description.\n"
            f"User Skills: {', '.join(req.skills)}\n"
            f"Job Description:\n{req.job_description}\n\n"
            "Return a JSON object containing exactly four keys:\n"
            "1. 'match_score' (an integer percentage from 0 to 100 based on skill overlaps).\n"
            "2. 'matching_skills' (list of skills that match the requirements).\n"
            "3. 'missing_skills' (list of key skills requested but not found in user skills).\n"
            "4. 'preparation_tips' (one or two actionable sentences explaining how the user can prepare/upskill for this job).\n"
            "Return only valid raw JSON without markdown code fences."
        )
        response_text = query_llm(
            prompt=prompt,
            system_prompt="You are a recruiter helper. Return JSON only.",
            temperature=0.2
        )
        import json
        clean_content = response_text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_content)
        return data
    except Exception as e:
        print(f"LLM job matching failed: {e}. Falling back to rule-based analysis.")

    # Rule-based fallback job matcher
    desc_lower = req.job_description.lower()
    matching_skills = []
    missing_skills = []
    
    # Check overlap
    for skill in user_skills:
        if skill in desc_lower:
            matching_skills.append(skill)
            
    # Simple list of common required skills to check for gaps
    common_reqs = ["react", "node.js", "python", "typescript", "docker", "kubernetes", "postgres", "aws", "redis", "system design", "fastapi"]
    for req_skill in common_reqs:
        if req_skill in desc_lower and req_skill not in user_skills:
            missing_skills.append(req_skill)
            
    overlap_count = len(matching_skills)
    total_expected = len(matching_skills) + len(missing_skills)
    
    if total_expected == 0:
        match_score = 50
    else:
        match_score = int((overlap_count / total_expected) * 100)
        
    # Introduce random adjustments to look dynamic
    match_score = max(20, min(95, match_score))
    
    prep_tips = "Review the basic principles of " + (", ".join(missing_skills[:2]) if missing_skills else "system design and APIs") + " to stand out during the interview."
    
    return {
        "match_score": match_score,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "preparation_tips": prep_tips
    }

@app.post("/api/ai/cold-email")
async def generate_cold_email(req: ColdEmailRequest):
    projects = req.github_projects or []
    
    from llm import query_llm
    try:
        prompt = (
            f"Write a personalized cold email or LinkedIn outreach message from '{req.user_name}' applying for '{req.job_title}' at '{req.company}'.\n"
            f"Their Skills: {', '.join(req.skills)}\n"
            f"Projects to highlight: {', '.join(projects)}\n"
            f"Job description summary:\n{req.job_description}\n\n"
            "Return a JSON object containing exactly two keys:\n"
            "1. 'email_subject' (a catchy professional subject line)\n"
            "2. 'email_body' (the email text body, formatted with newlines)\n"
            "Return only valid raw JSON without markdown code fences."
        )
        response_text = query_llm(
            prompt=prompt,
            system_prompt="You are a professional copywriter. Return JSON only.",
            temperature=0.7
        )
        import json
        clean_content = response_text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_content)
        return data
    except Exception as e:
        print(f"LLM email generation failed: {e}. Falling back to template generation.")

    # Rule-based fallback template generator
    subject = f"Inquiry: {req.job_title} application - {req.user_name}"
    
    project_mention = f" involving {', '.join(projects[:2])}" if projects else ""
    skills_mention = f", including {', '.join(req.skills[:3])}," if req.skills else ""
    
    body = (
        f"Hi Hiring Team,\n\n"
        f"I recently came across the {req.job_title} role at {req.company} and was immediately drawn to it. "
        f"As a developer with a background in engineering{skills_mention} I believe my profile aligns well with your team's goals.\n\n"
        f"I have built projects recently{project_mention} where I applied problem-solving and software architecture concepts. "
        f"I would love to learn more about the team's engineering challenges and how my skill set could add value.\n\n"
        f"Thank you for your time, and I look forward to connecting.\n\n"
        f"Best regards,\n"
        f"{req.user_name}\n"
        f"GitHub Profile: github.com/{req.user_name.lower().replace(' ', '')}"
    )
    
    return {
        "email_subject": subject,
        "email_body": body
    }

import io
from pypdf import PdfReader
import docx

def extract_text_from_pdf(file_bytes: bytes) -> str:
    pdf_file = io.BytesIO(file_bytes)
    reader = PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    docx_file = io.BytesIO(file_bytes)
    doc = docx.Document(docx_file)
    text = ""
    for paragraph in doc.paragraphs:
        if paragraph.text:
            text += paragraph.text + "\n"
    return text

from fastapi import UploadFile, File

@app.post("/api/ai/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    filename = file.filename.lower()
    content = await file.read()
    
    extracted_text = ""
    try:
        if filename.endswith(".pdf"):
            extracted_text = extract_text_from_pdf(content)
        elif filename.endswith(".docx") or filename.endswith(".doc"):
            extracted_text = extract_text_from_docx(content)
        elif filename.endswith(".txt"):
            extracted_text = content.decode("utf-8", errors="ignore")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a PDF, DOCX, or TXT file.")
            
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract any text from the uploaded file. Please make sure it is not scanned or empty.")
            
        return {"text": extracted_text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")

