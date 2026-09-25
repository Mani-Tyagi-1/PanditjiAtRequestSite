import { create } from "zustand";
import { StreamVideoClient } from "@stream-io/video-react-sdk";

type StreamState = {
  client: StreamVideoClient | null;
  setClient: (client: StreamVideoClient) => void;
};

export const useStreamClientStore = create<StreamState>((set) => ({
  client: null,
  setClient: (client) => set({ client }),
}));