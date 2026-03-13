import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  StreamCall,
  StreamTheme,
  useCall,
  useCallStateHooks,
  CallingState,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  User, 
  Loader2 
} from "lucide-react";
import { useStreamClientStore } from "./streamClientStore";
import { useAuth } from "../context/AuthContext";
import { initStreamClient } from "./initStreamClient";
import { motion, AnimatePresence } from "framer-motion";

const AudioCallInterface = () => {
  const call = useCall();
  const { useParticipants, useMicrophoneState, useCallCallingState } = useCallStateHooks();
  const participants = useParticipants();
  const { isMute } = useMicrophoneState();
  const callingState = useCallCallingState();
  const navigate = useNavigate();

  const [isEnding, setIsEnding] = useState(false);

  // Check if we are waiting for the other person
  const remoteParticipant = useMemo(() => {
    return participants.find((p) => !p.isLocalParticipant);
  }, [participants]);

  const isConnected = remoteParticipant && callingState === CallingState.JOINED;

  // Watchdog logic from mobile reference: if alone for too long, end call
  useEffect(() => {
    if (!call || isConnected) return;

    // Give 30 seconds for the receiver to join
    const timeout = setTimeout(async () => {
      if (!remoteParticipant) {
        console.log("[AudioCall] Alone in call for too long, ending...");
        await call.endCall();
        navigate("/my-bookings");
      }
    }, 30000);

    return () => clearTimeout(timeout);
  }, [call, remoteParticipant, isConnected, navigate]);

  const handleEndCall = async () => {
    if (!call || isEnding) return;
    setIsEnding(true);
    try {
      await call.endCall();
      navigate("/my-bookings");
    } catch (err) {
      console.error("Failed to end call", err);
      navigate("/my-bookings");
    }
  };

  const toggleMic = async () => {
    if (!call) return;
    await call.microphone.toggle();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6">
      {/* Background Pulse for calling state */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute w-64 h-64 bg-orange-500 rounded-full blur-3xl pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* Avatar Area */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 rounded-full bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center overflow-hidden">
            {remoteParticipant?.image ? (
              <img src={remoteParticipant.image} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-16 h-16 text-orange-500" />
            )}
          </div>
          
          {/* Pulse circles */}
          {!isConnected && (
            <>
              <motion.div 
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 border-2 border-orange-500 rounded-full"
              />
              <motion.div 
                animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                className="absolute inset-0 border-2 border-orange-500 rounded-full"
              />
            </>
          )}
        </div>

        {/* User Info */}
        <h2 className="text-2xl font-black mb-2 text-center">
          {remoteParticipant?.name || "Pandit ji"}
        </h2>
        <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-12">
          {isConnected ? "Connected" : "Calling..."}
        </p>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-8">
          <button
            onClick={toggleMic}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isMute 
              ? "bg-red-500/20 border border-red-500/30 text-red-500" 
              : "bg-white/10 border border-white/20 text-white"
            }`}
          >
            {isMute ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            onClick={handleEndCall}
            disabled={isEnding}
            className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 hover:bg-red-700 active:scale-95 transition-all"
          >
            <PhoneOff className="w-6 h-6 fill-white" />
          </button>
        </div>

        {/* Status Text Block */}
        {!isConnected && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-16 text-white/40 text-sm italic font-medium"
            >
              Waiting for other participant to join...
            </motion.p>
        )}
      </div>

      {/* Exit Button - top left */}
      <button 
        onClick={() => navigate("/my-bookings")}
        className="absolute top-8 left-8 text-white/40 hover:text-white transition-colors"
      >
        Exit
      </button>
    </div>
  );
};

const AudioCallPage = () => {
  const { callId } = useParams();
  const client = useStreamClientStore((s) => s.client);
  const { user } = useAuth();
  const [call, setCall] = useState<any>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const setupCall = async () => {
      if (!client && user) {
        try {
          await initStreamClient(user._id, user.name || user.userName || "User");
        } catch (err) {
          console.error("Failed to init stream client", err);
          setInitError("Authentication failed");
        }
      }
    };
    setupCall();
  }, [client, user]);

  useEffect(() => {
    if (!client || !callId) return;

    console.log("callId", callId);

    const actualCallId = callId.endsWith("_AC") ? callId : `${callId}_AC`;
    const myCall = client.call("default", actualCallId);
    
    // Join with video: false for audio-only session
    myCall.join({ create: true, video: false }).then(async () => {
      // Set custom metadata for the receiver
      try {
        await myCall.update({
          custom: {
            callerName: user?.name || user?.userName || "User",
            type: "audio",
          },
        });
      } catch (err) {
        console.warn("Failed to update call metadata", err);
      }
      
      setCall(myCall);
    }).catch((err) => {
      console.error("Failed to join call", err);
      setInitError("Failed to join call");
    });

    return () => {
      if (myCall.state.callingState !== CallingState.LEFT) {
          myCall.leave().catch(console.error);
      }
    };
  }, [client, callId]);

  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <p className="text-red-500 mb-4">{initError}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white/10 rounded-xl">Retry</button>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
        <p className="text-white/60 font-medium">Initializing Audio Call...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0a]">
      <StreamTheme>
        <StreamCall call={call}>
          <AudioCallInterface />
        </StreamCall>
      </StreamTheme>
    </div>
  );
};

export default AudioCallPage;
