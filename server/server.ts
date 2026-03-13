// server.ts
import express, { Request, Response } from "express";
import dotenv from "dotenv";
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

// Start server
const PORT = process.env.PORT || 8000;
app.listen(8000, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
