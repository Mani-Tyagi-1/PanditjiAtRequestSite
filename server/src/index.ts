import express, { Request, Response } from "express";
import * as http from "http";
import * as dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";

// Config & DB
import { panditJiAtRequestDB } from "../config/connectDB";
import { VVMainConnectDB } from "../config/vedicVaibhavDB";

// Utils
import { validateEnv } from "./utils/env";
import { setupSocketHandlers } from "./socketHandler";

// Middlewares
import { applyCommonMiddlewares } from "./middlewares/commonMiddlewares";
import { errorMiddleware } from "./middlewares/errorMiddleware";

// Routes
import apiRoutes from "./routes/index";
import { generateStreamToken } from "./controllers/userApp/StreamTokenController";
import UserAddressModel from "./models/userApp/userAddressModel";

dotenv.config();

const app = express();
const server = http.createServer(app);

// 1. Validate Environment
validateEnv();

// 2. Apply Security & Utility Middlewares
applyCommonMiddlewares(app);

// 3. Socket.io setup
const io = new SocketIOServer(server, {
  cors: { 
    origin: process.env.CORS_ORIGIN || "*", 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] 
  },
});

app.set("io", io);
setupSocketHandlers(io);

// 4. API Routes
app.use("/api", apiRoutes);

// Special endpoints (kept as in original)
app.get("/gen-stream-token/:userId", generateStreamToken);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: "ok", 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 5. Global Error Handler
app.use(errorMiddleware);

const PORT = Number(process.env.PORT) || 8001;

async function startServer() {
  try {
    console.log("🕒 Connecting to databases...");
    await Promise.all([
      panditJiAtRequestDB(),
      VVMainConnectDB()
    ]);

    // Cleanup old indexes if necessary
    try {
      await UserAddressModel.collection.dropIndex("user_1_addressName_1");
      console.log("✅ Old index dropped");
    } catch { 
      // Ignored if index doesn't exist
    }

    console.log("🚀 Starting server...");
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🌐 Server running on http://localhost:${PORT}`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      
      io.close(() => {
        console.log("🔌 Socket server closed.");
      });

      server.close(() => {
        console.log("📡 HTTP server closed.");
        process.exit(0);
      });

      // Force close after 10s
      setTimeout(() => {
        console.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

  } catch (error) {
    console.error("💥 Startup error:", error);
    process.exit(1);
  }
}

startServer();

export default app;
