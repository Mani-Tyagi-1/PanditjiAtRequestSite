import apiClient from "../api/apiClient";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import { useStreamClientStore } from "./streamClientStore";

const apiKey = "s22skkdyjhaf";

export async function initStreamClient(userId: string, name: string) {
  const res = await apiClient.get(`/stream/gen-stream-token/${userId}`);

  const token = res.data.token;

  const client = new StreamVideoClient({
    apiKey,
    user: {
      id: userId,
      name,
    },
    token,
  });

  client.on("connection.changed", (event) => {

    if (event.online === false) {
      console.log("Connection lost");
    }

    if (event.online === true) {
      console.log("Reconnected");
    }

  });

  useStreamClientStore.getState().setClient(client);



  return client;
}