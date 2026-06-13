import { create } from "zustand";
import axios from "axios";
import { getSocket } from "../utils/socketClient";
import API_URL from "../utils/apiConfig";

type LatLng = { latitude: number; longitude: number };

type State = {
  panditLocation: LatLng | null;
  loading: boolean;
  connected: boolean;
  startTracking: (panditId: string) => Promise<void>;
  stopTracking: () => void;
};

let currentPanditId: string | null = null;

export const usePanditTrackingStore = create<State>((set) => ({
  panditLocation: null,
  loading: false,
  connected: false,

  startTracking: async (panditId: string) => {
    if (!panditId) return;

    currentPanditId = panditId;
    set({ loading: true });

    // 1) Fetch initial location
    try {
      const apiUrl = API_URL;
      const url = `${apiUrl}/pandit/${encodeURIComponent(panditId)}/location`;

      const res = await axios.get(url);
      if (res?.data?.latitude && res?.data?.longitude) {
        set({
          panditLocation: {
            latitude: Number(res.data.latitude),
            longitude: Number(res.data.longitude),
          },
        });
      }
    } catch (e) {
      console.log("[Tracking] Initial fetch failed (expected if tracking just started):", (e as any)?.message);
    }

    // 2) Socket logic
    const socket = getSocket();

    socket.off("connect");
    socket.off("disconnect");
    socket.off("user:pandit_location");

    socket.on("connect", () => {
      set({ connected: true });
      if (currentPanditId) {
        socket.emit("user:track_pandit", currentPanditId);
      }
    });

    socket.on("disconnect", () => set({ connected: false }));

    socket.on("user:pandit_location", (data: any) => {
      if (!data?.panditId || !currentPanditId) return;
      if (String(data.panditId) !== String(currentPanditId)) return;

      const lat = Number(data.latitude);
      const lng = Number(data.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      set({ panditLocation: { latitude: lat, longitude: lng } });
    });

    if (!socket.connected) {
      socket.connect();
    } else {
      socket.emit("user:track_pandit", currentPanditId);
      set({ connected: true });
    }

    set({ loading: false });
  },

  stopTracking: () => {
    currentPanditId = null;
    const socket = getSocket();
    socket.off("user:pandit_location");
    socket.off("connect");
    socket.off("disconnect");

    // We don't always want to disconnect the socket if it's used elsewhere, 
    // but mirror the mobile behavior of stopping track.
    set({ panditLocation: null, loading: false, connected: false });
  },
}));
