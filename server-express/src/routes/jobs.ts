import { Router, Request, Response } from "express";
import prisma from "../db";

const router = Router();

// Sample seed jobs
const SEED_JOBS = [
  {
    title: "Software Engineer (Frontend)",
    company: "TechNova Solutions",
    location: "Remote (USA / Europe)",
    description: "We are looking for a Senior React Engineer experienced in state management, responsive designs, and modern CSS frameworks. You will lead the development of our flagship SaaS product.",
    salary: "$110,000 - $140,000",
    url: "https://example.com/jobs/1",
    tags: ["React", "JavaScript", "CSS", "Frontend", "Zustand"]
  },
  {
    title: "Backend Engineer (Node.js & Prisma)",
    company: "CloudVibe Technologies",
    location: "Bengaluru, India (Hybrid)",
    description: "Seeking a Backend Engineer proficient in Node.js, Express, TypeScript, and Postgres. Familiarity with ORMs like Prisma and caching systems like Redis is highly desired.",
    salary: "₹12,00,000 - ₹18,00,000",
    url: "https://example.com/jobs/2",
    tags: ["Node.js", "Express", "TypeScript", "PostgreSQL", "Prisma", "Backend"]
  },
  {
    title: "AI Agent & LangChain Developer",
    company: "Cerebro AI",
    location: "San Francisco, CA (Onsite)",
    description: "Join our core AI team. You will build and scale multi-agent LLM systems using LangGraph, FastAPI, and Vector Databases. Experience in engineering prompt graphs is required.",
    salary: "$140,000 - $180,000",
    url: "https://example.com/jobs/3",
    tags: ["Python", "FastAPI", "LangGraph", "Gemini", "AI", "Vector DB"]
  },
  {
    title: "DevOps Engineer (AWS & Kubernetes)",
    company: "ScaleGrid Systems",
    location: "Remote (India)",
    description: "Scale and monitor cloud infrastructures. Strong skills in Docker, AWS, Kubernetes, Terraform, and CI/CD pipelines are needed.",
    salary: "₹15,00,000 - ₹22,00,000",
    url: "https://example.com/jobs/4",
    tags: ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "DevOps"]
  },
  {
    title: "Full Stack Engineer (MERN)",
    company: "Velocity Hub",
    location: "Mumbai, India (Hybrid)",
    description: "Build robust full-stack solutions. Require strong hands-on experience in React.js, Express, MongoDB, Node.js, and deploying containerized applications.",
    salary: "₹8,00,000 - ₹12,00,000",
    url: "https://example.com/jobs/5",
    tags: ["React", "Node.js", "Express", "MongoDB", "JavaScript", "Full Stack"]
  },
  {
    title: "Junior Python Backend Developer",
    company: "PyStream Systems",
    location: "Remote (Global)",
    description: "Great entry level position. You will assist in writing API endpoints using FastAPI and Flask, configuring databases, and writing unit tests.",
    salary: "$50,000 - $70,000",
    url: "https://example.com/jobs/6",
    tags: ["Python", "FastAPI", "Flask", "PostgreSQL", "Backend"]
  }
];

// Get all jobs (auto seeds if database is empty)
router.get("/", async (req: Request, res: Response) => {
  try {
    let jobs = await prisma.job.findMany();

    if (jobs.length === 0) {
      console.log("No jobs found, seeding sample jobs...");
      await prisma.job.createMany({
        data: SEED_JOBS,
      });
      jobs = await prisma.job.findMany();
    }

    return res.json(jobs);
  } catch (error: any) {
    console.error("Error retrieving jobs:", error);
    return res.status(500).json({ error: "Failed to load job listings" });
  }
});

export default router;
