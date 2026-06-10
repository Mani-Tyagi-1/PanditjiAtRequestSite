"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http = __importStar(require("http"));
const dotenv = __importStar(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const connectDB_1 = require("./config/connectDB");
const vedicVaibhavDB_1 = require("./config/vedicVaibhavDB");
// User/Pandit routes
const panditRoutes_1 = __importDefault(require("./routes/panditAppRoutes/panditRoutes"));
const poojaRoutes_1 = __importDefault(require("./routes/userAppRoutes/poojaRoutes"));
const pujaCategoryRoutes_1 = __importDefault(require("./routes/userAppRoutes/pujaCategoryRoutes"));
const mobileOtpRoutes_1 = __importDefault(require("./routes/userAppRoutes/mobileOtpRoutes"));
const userAddressRoutes_1 = __importDefault(require("./routes/userAppRoutes/userAddressRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userAppRoutes/userRoutes"));
const configRoutes_1 = __importDefault(require("./routes/userAppRoutes/configRoutes"));
const testimonialRoutes_1 = __importDefault(require("./routes/userAppRoutes/testimonialRoutes"));
const poojaBookingRoutes_1 = __importDefault(require("./routes/poojaBookingRouts/poojaBookingRoutes"));
const callingroutesused_1 = __importDefault(require("./routes/pushroutescontroller/callingroutesused"));
const pushnotificationfirebaseroutes_1 = __importDefault(require("./routes/pushroutescontroller/pushnotificationfirebaseroutes"));
const StreamTokenController_1 = require("./controller/userApp/StreamTokenController");
const consultancyLeadRoutes_1 = __importDefault(require("./routes/userAppRoutes/consultancyLeadRoutes"));
const referralRoutes_1 = __importDefault(require("./routes/userAppRoutes/referralRoutes"));
const pujaEnquiryRoutes_1 = __importDefault(require("./routes/userAppRoutes/pujaEnquiryRoutes"));
const paidConsultationRoutes_1 = __importDefault(require("./routes/userAppRoutes/paidConsultationRoutes"));
const PanditRoute_1 = __importDefault(require("./routes/panditAppRoutes/PanditRoute"));
const UserDeleteRoute_1 = __importDefault(require("./routes/userAppRoutes/UserDeleteRoute"));
const panditDirectBookingEnquiryRoutes_1 = __importDefault(require("./routes/userAppRoutes/panditDirectBookingEnquiryRoutes"));
const whatsapp_routes_1 = __importDefault(require("./routes/whatsapp/whatsapp.routes"));
// Pandit app auth & address routes
const panditAuthRoutes_1 = __importDefault(require("./routes/panditAppRoutes/panditAuthRoutes"));
const panditAddressRoutes_1 = __importDefault(require("./routes/panditAppRoutes/panditAddressRoutes"));
const genTokenRoutes_1 = __importDefault(require("./routes/voiceCallRoutes/genTokenRoutes"));
const panditModel_1 = __importDefault(require("./model/panditApp/panditModel"));
const userAddressModel_1 = __importDefault(require("./model/userApp/userAddressModel"));
dotenv.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));
// Routes
app.use("/api/pandit", panditRoutes_1.default);
app.use("/api/", poojaRoutes_1.default);
app.use("/api/", pujaCategoryRoutes_1.default);
app.use("/api/", mobileOtpRoutes_1.default);
app.use("/api/addresses", userAddressRoutes_1.default);
app.use("/api/config", configRoutes_1.default);
app.use("/api", testimonialRoutes_1.default);
app.use("/api", poojaBookingRoutes_1.default);
app.use("/api", userRoutes_1.default);
app.use("/api/calls", callingroutesused_1.default);
app.use("/api", pushnotificationfirebaseroutes_1.default);
app.use("/api/stream", genTokenRoutes_1.default);
app.use("/api", consultancyLeadRoutes_1.default);
app.use("/api", referralRoutes_1.default);
app.use("/api", pujaEnquiryRoutes_1.default);
app.use("/api", paidConsultationRoutes_1.default);
app.use("/api", panditDirectBookingEnquiryRoutes_1.default);
app.use("/api/whatsapp", whatsapp_routes_1.default);
app.get("/gen-stream-token/:userId", StreamTokenController_1.generateStreamToken);
// Pandit routes
app.use("/", panditAuthRoutes_1.default);
app.use("/", panditAddressRoutes_1.default);
app.use("/api", PanditRoute_1.default);
app.use("/api/user", UserDeleteRoute_1.default);
const PORT = process.env.PORT || 8001;
const server = http.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] },
});
app.set("io", io);
io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);
    socket.on("pandit:join", (panditId) => {
        const room = `pandit:${panditId}`;
        socket.join(room);
        console.log(`👳 Pandit joined ${room}`);
    });
    socket.on("pandit:join_active_pool", () => {
        socket.join("active_pandits");
        console.log(`👳 Pandit ${socket.id} joined active_pandits`);
    });
    socket.on("user:track_pandit", (panditId) => {
        const room = `pandit:${panditId}`;
        socket.join(room);
        console.log(`👤 User tracking pandit in room: ${room}`);
    });
    socket.on("pandit:location_update", async (data) => {
        const { panditId, latitude, longitude } = data;
        const room = `pandit:${panditId}`;
        io.to(room).emit("user:pandit_location", {
            panditId,
            latitude,
            longitude,
        });
        try {
            await panditModel_1.default.findByIdAndUpdate(panditId, {
                "location.latitude": latitude,
                "location.longitude": longitude,
            });
        }
        catch (err) {
            console.error("Failed to update pandit location:", err);
        }
    });
    socket.on("disconnect", () => {
        console.log("🔌 Socket disconnected:", socket.id);
    });
});
// Error handler
const errorHandler = (err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal Server Error" });
};
app.use(errorHandler);
async function startServer() {
    try {
        console.log("Connecting to databases...");
        await (0, connectDB_1.panditJiAtRequestDB)();
        await (0, vedicVaibhavDB_1.VVMainConnectDB)();
        try {
            await userAddressModel_1.default.collection.dropIndex("user_1_addressName_1");
            console.log("✅ Old index dropped");
        }
        catch { }
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
    }
    catch (error) {
        console.error("Startup error:", error);
        process.exit(1);
    }
}
startServer();
exports.default = app;
