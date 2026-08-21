// Load environment configuration (.env + .env.dev/.env.production) before anything
// else reads process.env.
import "./config/loadEnv";

import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import * as http from "http";
import cors from "cors";
import compression from "compression";
import { Server as SocketIOServer } from "socket.io";

import { panditJiAtRequestDB } from "./config/connectDB";
import { VVMainConnectDB } from "./config/vedicVaibhavDB";

// User/Pandit routes
import panditRoutes from "./routes/panditAppRoutes/panditRoutes";
import poojaRoutes from "./routes/userAppRoutes/poojaRoutes";
import pujaCategoryRoutes from "./routes/userAppRoutes/pujaCategoryRoutes";
import mobileOtpRoutes from "./routes/userAppRoutes/mobileOtpRoutes";
import userAddressRoutes from "./routes/userAppRoutes/userAddressRoutes";
import userRoutes from "./routes/userAppRoutes/userRoutes";
import configRoutes from "./routes/userAppRoutes/configRoutes";
import testimonialRoutes from "./routes/userAppRoutes/testimonialRoutes";
import poojaBookingRoutes from "./routes/poojaBookingRouts/poojaBookingRoutes";
import callingRoutes from "./routes/pushroutescontroller/callingroutesused";
import pushRoutes from "./routes/pushroutescontroller/pushnotificationfirebaseroutes";
import { generateStreamToken } from "./controller/userApp/StreamTokenController";
import consultancyLeadRoutes from "./routes/userAppRoutes/consultancyLeadRoutes";
import referralRoutes from "./routes/userAppRoutes/referralRoutes";
import pujaEnquiryRoutes from "./routes/userAppRoutes/pujaEnquiryRoutes";
import abandonedCartRoutes from "./routes/userAppRoutes/abandonedCartRoutes";
import paidConsultationRoutes from "./routes/userAppRoutes/paidConsultationRoutes";
import panditRoute from "./routes/panditAppRoutes/PanditRoute";
import userRoute from "./routes/userAppRoutes/UserDeleteRoute";
import panditDirectBookingEnquiryRoutes from "./routes/userAppRoutes/panditDirectBookingEnquiryRoutes";
import whatsappRoutes from "./routes/whatsapp/whatsapp.routes";
import liveMandirRoutes from "./routes/userAppRoutes/liveMandirRoutes";
import chadhavaRoutes from "./routes/userAppRoutes/chadhavaRoutes";
import vivahRoutes from "./routes/userAppRoutes/vivahRoutes";
import kashiRoutes from "./routes/userAppRoutes/kashiRoutes";
import shopRoutes from "./routes/userAppRoutes/shopRoutes";
import holyPanditRoutes from "./routes/userAppRoutes/holyPanditRoutes";
import shopifyProductRoutes from "./routes/userAppRoutes/shopifyProductRoutes";
import shopifyOrderRoutes from "./routes/userAppRoutes/shopifyOrderRoutes";
import seoRoutes from "./routes/seoRoutes";
import affiliateProductsRoutes from "./routes/userAppRoutes/affiliateProductsRoutes";
import razorpayWebhookRoutes from "./routes/payments/razorpayWebhookRoutes";
import analyticsRoutes from "./routes/analytics/analyticsRoutes";

// Pandit app auth & address routes
import panditAuthRoutes from "./routes/panditAppRoutes/panditAuthRoutes";
import panditAddressRoutes from "./routes/panditAppRoutes/panditAddressRoutes";
import streamRoutes from "./routes/voiceCallRoutes/genTokenRoutes";
import PanditModel from "./model/panditApp/panditModel";
import UserAddressModel from "./model/userApp/userAddressModel";

// Normalize cross-service URLs (partner-affiliate commission engine) for the current APP_ENV.
// MUST stay a require(): env is loaded by ./config/loadEnv (imported first, at the top of this
// file), and a plain `import` here could hoist above that and read an empty process.env.
// See src/config/environment.ts for the local/production rules.
require("./config/environment");

const app = express();
// Gzip all responses (safe, transparent) — big payload-size win for API responses.
app.use(compression());

// Capture the raw request body so webhook handlers can verify HMAC signatures.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);

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
app.use("/api", testimonialRoutes);

app.use("/api", poojaBookingRoutes);
app.use("/api", userRoutes);
app.use("/api/calls", callingRoutes);
app.use("/api", pushRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api", consultancyLeadRoutes);
app.use("/api", referralRoutes);
app.use("/api", pujaEnquiryRoutes);
app.use("/api", abandonedCartRoutes);
app.use("/api", paidConsultationRoutes);
app.use("/api", panditDirectBookingEnquiryRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api", liveMandirRoutes);
app.use("/api", chadhavaRoutes);
app.use("/api", vivahRoutes);
app.use("/api", kashiRoutes);
app.use("/api", shopRoutes);
app.use("/api/affiliate", affiliateProductsRoutes);
app.use("/api", holyPanditRoutes);
app.use("/api", shopifyProductRoutes);
app.use("/api", shopifyOrderRoutes);
// Razorpay server-to-server payment confirmation for every service.
// Mounted at BOTH spellings on purpose: the singular "/api/payment" is easy to
// type into the Razorpay dashboard by mistake, and a webhook registered one
// letter off silently 404s — every paid booking then sits unconfirmed with no
// error anywhere except Razorpay's own delivery log. Accepting both costs
// nothing and removes a failure mode that is invisible from this side.
app.use("/api/payments", razorpayWebhookRoutes);
app.use("/api/payment", razorpayWebhookRoutes);
// Parks the browser's GA4/Ads ids against an order id so the webhook above can
// report the purchase as the right visitor. See utils/serverAnalytics.ts.
app.use("/api/analytics", analyticsRoutes);

app.get("/gen-stream-token/:userId", generateStreamToken);

// Pandit routes
app.use("/", panditAuthRoutes);
app.use("/", panditAddressRoutes);

app.use("/api", panditRoute);
app.use("/api/user", userRoute);
app.use("/api/seo", seoRoutes);

const PORT = process.env.PORT || 8001;

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
    } catch { }

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
