import express, { Request, Response } from "express";
import * as dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db";
import panditRoutes from "./routes/PanditRoute";

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", panditRoutes);

// Health check (optional but useful)
app.get("/", (_req: Request, res: Response) => {
  res.send("Server is running 🚀");
});

// Start server
const PORT = process.env.PORT || 8000;

app.listen(8000, "0.0.0.0", () => {
  console.log(`🌐 Server running on http://0.0.0.0:${PORT}`);
});