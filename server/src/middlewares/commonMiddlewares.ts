import express, { Application, RequestHandler } from "express";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import hpp from "hpp";
import { rateLimit } from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

export const applyCommonMiddlewares = (app: Application) => {
  // Security headers
  app.use(helmet() as RequestHandler);
  
  // CORS
  app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type", 
      "Authorization", 
      "x-user-id", 
      "x-event-source-url", 
      "x-fbp", 
      "x-fbc"
    ],
  }) as RequestHandler);

  // Prevent HTTP Parameter Pollution
  app.use(hpp() as RequestHandler);

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Compression
  app.use(compression() as RequestHandler);

  // Logging
  if (process.env.NODE_ENV !== "test") {
    app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev") as RequestHandler);
  }

  // Rate limiting (apply to /api/ routes)
  app.use("/api/", limiter as unknown as RequestHandler);
};

