import { Server as SocketIOServer, Socket } from "socket.io";
import PanditModel from "./models/panditApp/panditModel";

export const setupSocketHandlers = (io: SocketIOServer) => {
  io.on("connection", (socket: Socket) => {
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
};
