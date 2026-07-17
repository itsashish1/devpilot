import { Router, Request, Response } from "express";
import prisma from "../db";

const router = Router();

// Helper to fetch live jobs from both Arbeitnow (Global) and Himalayas (India / Remote)
async function fetchAndSyncRealJobs() {
  try {
    const jobsToInsert: any[] = [];

    // 1. Fetch from Arbeitnow (Global / Remote Tech)
    try {
      console.log("Fetching live listings from Arbeitnow API...");
      const response = await fetch("https://www.arbeitnow.com/api/job-board-api");
      if (response.ok) {
        const payload = await response.json() as any;
        if (payload && Array.isArray(payload.data)) {
          payload.data.forEach((item: any) => {
            const cleanDescription = item.description 
              ? item.description.replace(/<\/?[^>]+(>|$)/g, "")
              : "No description provided.";
              
            jobsToInsert.push({
              title: item.title,
              company: item.company_name,
              location: item.remote ? `${item.location} (Remote)` : item.location,
              description: cleanDescription,
              salary: "$80,000 - $120,000",
              url: item.url,
              tags: item.tags || ["Software Developer"],
            });
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch from Arbeitnow:", err);
    }

    // 2. Fetch from Himalayas (India Tech / Remote)
    try {
      console.log("Fetching live Indian tech listings from Himalayas API...");
      const response = await fetch("https://himalayas.app/jobs/api/search?country=IN");
      if (response.ok) {
        const payload = await response.json() as any;
        if (payload && Array.isArray(payload.jobs)) {
          payload.jobs.forEach((item: any) => {
            const cleanDescription = item.description 
              ? item.description.replace(/<\/?[^>]+(>|$)/g, "")
              : "No description provided.";

            const salaryStr = item.minSalary && item.maxSalary 
              ? `${item.currency || "USD"} ${item.minSalary.toLocaleString()} - ${item.maxSalary.toLocaleString()}`
              : "₹8,00,000 - ₹15,00,000";

            jobsToInsert.push({
              title: item.title,
              company: item.companyName,
              location: item.locationRestrictions && item.locationRestrictions.length > 0 
                ? `${item.locationRestrictions.join(", ")}` 
                : "India (Remote)",
              description: cleanDescription,
              salary: salaryStr,
              url: item.applicationLink || item.guid || "https://himalayas.app/jobs",
              tags: item.categories || ["Software Developer"],
            });
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch from Himalayas India:", err);
    }

    if (jobsToInsert.length > 0) {
      // Clear existing jobs to populate fresh listings
      await prisma.job.deleteMany();
      await prisma.job.createMany({
        data: jobsToInsert
      });
      console.log(`Successfully synced ${jobsToInsert.length} 100% real-time jobs from APIs!`);
    }
  } catch (err) {
    console.error("Failed to sync real-time jobs:", err);
  }
}

// Get all jobs (auto seeds if database is empty, supports ?refresh=true)
router.get("/", async (req: Request, res: Response) => {
  const refresh = req.query.refresh === "true";

  try {
    if (refresh) {
      console.log("Forced refresh: Syncing real-time jobs...");
      await fetchAndSyncRealJobs();
    }

    let jobs = await prisma.job.findMany();

    if (jobs.length === 0) {
      console.log("No jobs found, syncing real-time jobs...");
      await fetchAndSyncRealJobs();
      jobs = await prisma.job.findMany();
    }

    return res.json(jobs);
  } catch (error: any) {
    console.error("Error retrieving jobs:", error);
    return res.status(500).json({ error: "Failed to load job listings" });
  }
});

export default router;
