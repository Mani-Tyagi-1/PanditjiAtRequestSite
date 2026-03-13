import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  StreamCall,
  StreamTheme,
  SpeakerLayout,
  CallControls,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useStreamClientStore } from "./streamClientStore";
import { useAuth } from "../context/AuthContext";
import { initStreamClient } from "./initStreamClient";

const CallInterface = () => {
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const navigate = useNavigate();

  useEffect(() => {
    if (!call) return;

    const interval = setInterval(async () => {
      const participantCount = participants.length;
      console.log("Current participants:", participantCount);

      if (participantCount < 2) {
        console.log("Ending call due to timeout (only one participant)");
        await call.endCall();
        navigate("/my-bookings", { replace: true });
      }
    }, 15000); // Increased to 15s to give some time for joining

    return () => clearInterval(interval);
  }, [call, participants, navigate]);

  return (
    <StreamTheme>
      <SpeakerLayout />
      <CallControls onLeave={() => navigate("/my-bookings", { replace: true })} />
    </StreamTheme>
  );
};

const VideoCallPage = () => {
  const { callId } = useParams();
  const client = useStreamClientStore((s) => s.client);
  const { user } = useAuth();
  const [call, setCall] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupCall = async () => {
      if (!client && user) {
        await initStreamClient(user._id, user.name || "User");
      }
    };
    setupCall();
  }, [client, user]);

  useEffect(() => {
    if (!client || !callId) return;

    const myCall = client.call("default", callId);
    myCall.join({ create: true }).then(async () => {
      // Set custom metadata for the receiver
      try {
        await myCall.update({
          custom: {
            callerName: user?.name || user?.userName || "User",
            type: "video",
          },
        });
      } catch (err) {
        console.warn("Failed to update call metadata", err);
      }
      setCall(myCall);
      setLoading(false);
    }).catch((err) => {
      console.error("Failed to join call", err);
      setLoading(false);
    });

    return () => {
      // Clean up call on unmount if needed
    };
  }, [client, callId]);

  if (loading || !call) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FFFAF5]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF7000] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Joining Call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black">
      <StreamCall call={call}>
        <CallInterface />
      </StreamCall>
    </div>
  );
};

export default VideoCallPage;
