import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import prisma from "../db";

const router = Router();

// Get all applications for current user
router.get("/", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const applications = await prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return res.json(applications);
  } catch (error: any) {
    console.error("Error fetching applications:", error);
    return res.status(500).json({ error: "Failed to load application tracker" });
  }
});

// Create a new application tracker
router.post("/", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { jobTitle, company, status, notes } = req.body;

  if (!jobTitle || !company) {
    return res.status(400).json({ error: "Job title and company name are required" });
  }

  try {
    const newApp = await prisma.jobApplication.create({
      data: {
        userId,
        jobTitle,
        company,
        status: status || "SAVED",
        notes: notes || "",
        appliedAt: status && status !== "SAVED" ? new Date() : null,
      },
    });
    return res.status(201).json(newApp);
  } catch (error: any) {
    console.error("Error creating application tracker:", error);
    return res.status(500).json({ error: "Failed to save application tracker" });
  }
});

// Update application status or notes
router.put("/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const { status, notes } = req.body;

  try {
    const existing = await prisma.jobApplication.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Application tracker not found" });
    }

    const updatedApp = await prisma.jobApplication.update({
      where: { id },
      data: {
        status,
        notes,
        appliedAt: status && status !== "SAVED" && !existing.appliedAt ? new Date() : existing.appliedAt,
      },
    });

    return res.json(updatedApp);
  } catch (error: any) {
    console.error("Error updating application tracker:", error);
    return res.status(500).json({ error: "Failed to update application tracker" });
  }
});

// Delete application tracker
router.delete("/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  try {
    const existing = await prisma.jobApplication.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Application tracker not found" });
    }

    await prisma.jobApplication.delete({ where: { id } });
    return res.json({ message: "Application tracker deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting application tracker:", error);
    return res.status(500).json({ error: "Failed to delete application tracker" });
  }
});

export default router;
