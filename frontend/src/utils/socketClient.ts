import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const apiURL = import.meta.env.VITE_API_URL || "http://192.168.0.188:8000/api";
    // Convert e.g. http://192.168.0.188:8000/api -> http://192.168.0.188:8000
    const socketURL = apiURL.replace(/\/api\/?$/, "");

    socket = io(socketURL, {
      transports: ["websocket", "polling"],
      autoConnect: false,
      reconnection: true,
    });

    socket.on("connect", () => console.log("[Socket] connected:", socket?.id));
    socket.on("disconnect", () => console.log("[Socket] disconnected"));
    socket.on("connect_error", (err) => console.log("[Socket] connect_error:", err.message));
  }

  return socket;
};
