import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import jobRoutes from "./routes/jobs";
import applicationRoutes from "./routes/applications";

// Configure dotenv
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// Root welcome route
app.get("/", (req, res) => {
  res.send("<h1>DevPilot Express Core API</h1><p>Running and healthy.</p>");
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Express Core API] running on http://localhost:${PORT}`);
});
