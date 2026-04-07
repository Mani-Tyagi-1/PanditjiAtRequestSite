import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import * as http from "http";
import * as dotenv from "dotenv";
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
import configRoutes from "./routes/userAppRoutes/configRoutes";
import poojaBookingRoutes from "./routes/poojaBookingRouts/poojaBookingRoutes";
import callingRoutes from "./routes/pushroutescontroller/callingroutesused";
import pushRoutes from "./routes/pushroutescontroller/pushnotificationfirebaseroutes";
import { generateStreamToken } from "./controller/userApp/StreamTokenController";

// Pandit app auth & address routes
import panditAuthRoutes from "./routes/panditAppRoutes/panditAuthRoutes";
import panditAddressRoutes from "./routes/panditAppRoutes/panditAddressRoutes";
import streamRoutes from "./routes/voiceCallRoutes/genTokenRoutes";
import PanditModel from "./model/panditApp/panditModel";
import UserAddressModel from "./model/userApp/userAddressModel";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// Routes
app.use("/api/pandit", panditRoutes);
app.use("/api/", poojaRoutes);
app.use("/api/", pujaCategoryRoutes);
app.use("/api/", mobileOtpRoutes);
app.use("/api/addresses", userAddressRoutes);
app.use("/api/config", configRoutes);
app.use("/api", poojaBookingRoutes);
app.use("/api", userRoutes);
app.use("/api/calls", callingRoutes);
app.use("/api", pushRoutes);
app.use("/api/stream", streamRoutes);

app.get("/gen-stream-token/:userId", generateStreamToken);

// Pandit routes
app.use("/", panditAuthRoutes);
app.use("/", panditAddressRoutes);

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("pandit:join", (panditId: string) => {
    const room = `pandit:${panditId}`;
    socket.join(room);
    console.log(`👳 Pandit joined ${room}`);
  });

  socket.on("pandit:join_active_pool", () => {
    socket.join("active_pandits");
    console.log(`👳 Pandit ${socket.id} joined active_pandits`);
  });

  socket.on("user:track_pandit", (panditId: string) => {
    const room = `pandit:${panditId}`;
    socket.join(room);
    console.log(`👤 User tracking pandit in room: ${room}`);
  });

  socket.on("pandit:location_update", async (data: { panditId: string; latitude: number; longitude: number }) => {
    const { panditId, latitude, longitude } = data;
    const room = `pandit:${panditId}`;

    io.to(room).emit("user:pandit_location", {
      panditId,
      latitude,
      longitude,
    });

    try {
      await PanditModel.findByIdAndUpdate(panditId, {
        "location.latitude": latitude,
        "location.longitude": longitude,
      });
    } catch (err) {
      console.error("Failed to update pandit location:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected:", socket.id);
  });
});

// Error handler
const errorHandler: ErrorRequestHandler = (err, _req, res, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal Server Error" });
};

app.use(errorHandler);

async function startServer() {
  try {
    console.log("Connecting to databases...");
    await panditJiAtRequestDB();
    await VVMainConnectDB();

    try {
      await UserAddressModel.collection.dropIndex("user_1_addressName_1");
      console.log("✅ Old index dropped");
    } catch {}

    console.log("Starting server...");
    server.listen(PORT, () => {
      console.log(`🌐 Server running on http://localhost:${PORT}`);
    });

    const shutdown = () => {
      console.log("Shutting down...");
      io.close(() => {
        server.close(() => process.exit(0));
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (error) {
    console.error("Startup error:", error);
    process.exit(1);
  }
}

startServer();

export default app;