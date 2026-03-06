import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";

import { panditJiAtRequestDB } from "../config/connectDB";
import { VVMainConnectDB } from "../config/vedicVaibhavDB";

// User/Pandit routes
import panditRoutes from "./routes/panditAppRoutes/panditRoutes";
import poojaRoutes from "./routes/userAppRoutes/poojaRoutes";
import pujaCategoryRoutes from "./routes/userAppRoutes/pujaCategoryRoutes";
import mobileOtpRoutes from "./routes/userAppRoutes/mobileOtpRoutes";
import userAddressRoutes from "./routes/userAppRoutes/userAddressRoutes";
import userRoutes from "./routes/userAppRoutes/userRoutes";
import poojaBookingRoutes from "./routes/poojaBookingRouts/poojaBookingRoutes";

// Pandit app auth & address routes
import panditAuthRoutes from "./routes/panditAppRoutes/panditAuthRoutes";
import panditAddressRoutes from "./routes/panditAppRoutes/panditAddressRoutes";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// Mount the Pandit routes
app.use("/api/pandit", panditRoutes);
app.use("/api/", poojaRoutes);
app.use("/api/", pujaCategoryRoutes);
app.use("/api/", mobileOtpRoutes);
app.use("/api/addresses", userAddressRoutes);

app.use("/api", poojaBookingRoutes);
app.use("/api", userRoutes);

// PANDIT ROUTES
app.use('/', panditAuthRoutes);
app.use('/', panditAddressRoutes);

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] },
});

// expose io to controllers via app locals
app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("pandit:join", (panditId: string) => {
    const room = `pandit:${panditId}`;
    socket.join(room);
    console.log(`👳 Pandit joined ${room}`);
  });

  // ✅ allow pandits to join the global "active" room for timed requests
  socket.on("pandit:join_active_pool", () => {
    socket.join("active_pandits");
    console.log(`👳 Pandit ${socket.id} joined active_pandits`);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected:", socket.id);
  });
});

// Properly typed error handler so TS picks the right overload
const errorHandler: ErrorRequestHandler = (err, _req, res, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal Server Error" });
};
app.use(errorHandler);

// const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    console.log("Connecting to databases...");
    await panditJiAtRequestDB();
    await VVMainConnectDB();

    console.log("Starting the server...");
    server.listen(PORT, () => {
      console.log(`🌐 Server listening on http://localhost:${PORT}`);
    });

    // graceful shutdown
    const shutdown = () => {
      console.log("Shutting down...");
      io.close(() => {
        server.close(() => process.exit(0));
      });
    };
    process.on("SIGINT", () => shutdown());
    process.on("SIGTERM", () => shutdown());
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1);
  }
}

startServer();

export default app;