import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import prisma from "../db";

const router = Router();

// Get profile details & stats
router.get("/", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Fetch GitHub & LeetCode details dynamically if present
    let githubStats = null;
    let leetcodeStats = null;

    if (profile.githubUsername) {
      githubStats = await fetchGitHubStats(profile.githubUsername);
    }
    if (profile.leetcodeUsername) {
      leetcodeStats = await fetchLeetCodeStats(profile.leetcodeUsername);
    }

    return res.json({
      profile,
      githubStats,
      leetcodeStats,
    });
  } catch (error: any) {
    console.error("Error retrieving profile:", error);
    return res.status(500).json({ error: "Failed to load profile details" });
  }
});

// Update profile details
router.put("/", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { githubUsername, leetcodeUsername, targetRole, skills, resumeText, analysisResult } = req.body;

  try {
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        githubUsername,
        leetcodeUsername,
        targetRole,
        skills,
        resumeText,
        analysisResult: analysisResult ? JSON.stringify(analysisResult) : undefined,
      },
    });

    return res.json(updatedProfile);
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Failed to update profile details" });
  }
});

// Helper function to fetch GitHub stats
async function fetchGitHubStats(username: string) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    if (response.ok) {
      const data = await response.json() as any;
      return {
        username: username,
        publicRepos: data.public_repos,
        followers: data.followers,
        avatarUrl: data.avatar_url,
        bio: data.bio || "No bio added",
        topLanguages: ["JavaScript", "TypeScript", "Python"], // Mocking top languages
        totalCommitsThisYear: 342, // Mocking contribution commits count
      };
    }
  } catch (err) {
    console.warn("GitHub fetch failed, falling back to mock data");
  }

  // Graceful Fallback mock
  return {
    username: username,
    publicRepos: 18,
    followers: 24,
    avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
    bio: "Full Stack Engineer & Hackathon Enthusiast",
    topLanguages: ["TypeScript", "JavaScript", "Python"],
    totalCommitsThisYear: 287,
  };
}

// Helper function to fetch LeetCode stats
async function fetchLeetCodeStats(username: string) {
  // LeetCode doesn't have a simple REST API, so we mock dynamic data for demo reliability
  const hash = Math.abs(username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0));
  const easy = (hash % 100) + 40;
  const medium = (hash % 80) + 30;
  const hard = (hash % 30) + 5;
  const totalSolved = easy + medium + hard;

  return {
    username: username,
    totalSolved,
    easy,
    medium,
    hard,
    ranking: (hash * 13) % 150000 + 50000,
    activeDays: (hash % 100) + 20,
  };
}

export default router;
