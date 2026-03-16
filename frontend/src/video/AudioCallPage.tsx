import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  StreamCall,
  StreamTheme,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import {
  PhoneOff,
  Mic,
  MicOff,
  User,
  Loader2,
  Volume2,
  Ear,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "../context/AuthContext";
import { initStreamClient } from "./initStreamClient";
import { useStreamClientStore } from "./streamClientStore";

type OutputMode = "speaker" | "private";
type ScreenStage = "preparing" | "waiting" | "connected" | "error";

function PreparingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
      <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
      <p className="text-white/60 font-medium">Preparing Audio Call...</p>
    </div>
  );
}

function ErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
      <p className="text-red-500 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-white/10 rounded-xl"
      >
        Retry
      </button>
    </div>
  );
}

async function setSinkForAllMediaElements(sinkId: string) {
  const mediaEls = Array.from(
    document.querySelectorAll("audio, video")
  ) as HTMLMediaElement[];

  await Promise.allSettled(
    mediaEls.map(async (el) => {
      const anyEl = el as HTMLMediaElement & {
        setSinkId?: (id: string) => Promise<void>;
      };

      if (typeof anyEl.setSinkId === "function") {
        await anyEl.setSinkId(sinkId);
      }
    })
  );
}

function OutputToggle({
  outputMode,
  onUseSpeaker,
  onUsePrivateOutput,
  disabled,
}: {
  outputMode: OutputMode;
  onUseSpeaker: () => Promise<void>;
  onUsePrivateOutput: () => Promise<void>;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onUseSpeaker}
        disabled={disabled}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
          outputMode === "speaker"
            ? "bg-orange-500/20 border border-orange-500/40 text-orange-400"
            : "bg-white/10 border border-white/20 text-white"
        }`}
        title="Use speaker / default output"
      >
        <Volume2 className="w-6 h-6" />
      </button>

      <button
        onClick={onUsePrivateOutput}
        disabled={disabled}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
          outputMode === "private"
            ? "bg-orange-500/20 border border-orange-500/40 text-orange-400"
            : "bg-white/10 border border-white/20 text-white"
        }`}
        title="Use headset / selected output"
      >
        <Ear className="w-6 h-6" />
      </button>
    </div>
  );
}

function WaitingScreen({
  secondsLeft,
  onCancel,
  remoteName,
  remoteImage,
  outputMode,
  onUseSpeaker,
  onUsePrivateOutput,
}: {
  secondsLeft: number;
  onCancel: () => void;
  remoteName?: string;
  remoteImage?: string;
  outputMode: OutputMode;
  onUseSpeaker: () => Promise<void>;
  onUsePrivateOutput: () => Promise<void>;
}) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6">
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="absolute w-64 h-64 bg-orange-500 rounded-full blur-3xl pointer-events-none"
        />
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        <div className="mb-8 relative">
          <div className="w-32 h-32 rounded-full bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center overflow-hidden">
            {remoteImage ? (
              <img
                src={remoteImage}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-16 h-16 text-orange-500" />
            )}
          </div>

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
        </div>

        <h2 className="text-2xl font-black mb-2 text-center">
          {remoteName || "Pandit ji"}
        </h2>

        <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-6">
          Ringing...
        </p>

        <p className="text-white/50 text-sm mb-2">
          Waiting for other participant to join
        </p>

        <p className="text-white font-semibold text-lg mb-8">
          Time left: {mins}:{secs.toString().padStart(2, "0")}
        </p>

        <OutputToggle
          outputMode={outputMode}
          onUseSpeaker={onUseSpeaker}
          onUsePrivateOutput={onUsePrivateOutput}
        />

        <button
          onClick={onCancel}
          className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 hover:bg-red-700 active:scale-95 transition-all mt-8"
        >
          <PhoneOff className="w-6 h-6 fill-white" />
        </button>
      </div>
    </div>
  );
}

function LiveAudioCall({
  onExit,
  outputMode,
  onUseSpeaker,
  onUsePrivateOutput,
}: {
  onExit: () => void;
  outputMode: OutputMode;
  onUseSpeaker: () => Promise<void>;
  onUsePrivateOutput: () => Promise<void>;
}) {
  const call = useCall();
  const { useRemoteParticipants, useMicrophoneState } = useCallStateHooks();

  const remoteParticipants = useRemoteParticipants();
  const { isMute } = useMicrophoneState();
  const [isEnding, setIsEnding] = useState(false);

  const remoteParticipant = remoteParticipants[0];

  const handleLeave = async () => {
    if (!call || isEnding) return;
    setIsEnding(true);

    try {
      await call.leave();
    } catch (err) {
      console.error("Failed to leave call", err);
    } finally {
      onExit();
    }
  };

  const toggleMic = async () => {
    if (!call) return;
    try {
      await call.microphone.toggle();
    } catch (err) {
      console.error("Failed to toggle mic", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        <div className="mb-8 relative">
          <div className="w-32 h-32 rounded-full bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center overflow-hidden">
            {remoteParticipant?.image ? (
              <img
                src={remoteParticipant.image}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-16 h-16 text-orange-500" />
            )}
          </div>
        </div>

        <h2 className="text-2xl font-black mb-2 text-center">
          {remoteParticipant?.name || "Pandit ji"}
        </h2>

        <p className="text-green-500 font-bold uppercase tracking-widest text-xs mb-12">
          Connected
        </p>

        <div className="mt-8 flex items-center justify-center gap-6">
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

          <OutputToggle
            outputMode={outputMode}
            onUseSpeaker={onUseSpeaker}
            onUsePrivateOutput={onUsePrivateOutput}
          />

          <button
            onClick={handleLeave}
            disabled={isEnding}
            className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 hover:bg-red-700 active:scale-95 transition-all"
          >
            <PhoneOff className="w-6 h-6 fill-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AudioCallGate({
  stage,
  onExit,
  onCancelOutgoing,
  outputMode,
  onUseSpeaker,
  onUsePrivateOutput,
}: {
  stage: ScreenStage;
  onExit: () => void;
  onCancelOutgoing: () => Promise<void>;
  outputMode: OutputMode;
  onUseSpeaker: () => Promise<void>;
  onUsePrivateOutput: () => Promise<void>;
}) {
  const { useRemoteParticipants } = useCallStateHooks();
  const remoteParticipants = useRemoteParticipants();

  const [secondsLeft, setSecondsLeft] = useState(60);
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (stage !== "waiting") {
      clearTimers();
      return;
    }

    if (timeoutRef.current !== null || intervalRef.current !== null) return;

    setSecondsLeft(60);

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timeoutRef.current = window.setTimeout(async () => {
      await onCancelOutgoing();
    }, 60000);

    return clearTimers;
  }, [stage, clearTimers, onCancelOutgoing]);

  if (stage === "connected") {
    return (
      <LiveAudioCall
        onExit={onExit}
        outputMode={outputMode}
        onUseSpeaker={onUseSpeaker}
        onUsePrivateOutput={onUsePrivateOutput}
      />
    );
  }

  const remote = remoteParticipants[0];

  return (
    <WaitingScreen
      secondsLeft={secondsLeft}
      remoteName={remote?.name}
      remoteImage={remote?.image}
      onCancel={onCancelOutgoing}
      outputMode={outputMode}
      onUseSpeaker={onUseSpeaker}
      onUsePrivateOutput={onUsePrivateOutput}
    />
  );
}

const AudioCallPage = () => {
  const { callId, panditId } = useParams<{
    callId: string;
    panditId: string;
  }>();

  const { user } = useAuth();
  const navigate = useNavigate();

  const [call, setCall] = useState<any>(null);
  const [stage, setStage] = useState<ScreenStage>("preparing");
  const [initError, setInitError] = useState<string | null>(null);
  const [outputMode, setOutputMode] = useState<OutputMode>("speaker");

  const callRef = useRef<any>(null);
  const cleanedUpRef = useRef(false);

  const finalCallID = useMemo(
    () => (callId?.endsWith("_AC") ? callId : `${callId || ""}_AC`),
    [callId]
  );

  const cleanupAndExit = useCallback(async () => {
    if (cleanedUpRef.current) return;
    cleanedUpRef.current = true;

    try {
      await callRef.current?.leave?.();
    } catch (e) {
      console.warn("cleanup leave failed", e);
    }

    callRef.current = null;
    navigate("/my-bookings", { replace: true });
  }, [navigate]);

  const cancelOutgoingAndExit = useCallback(async () => {
    if (cleanedUpRef.current) return;
    cleanedUpRef.current = true;

    try {
      await callRef.current?.leave?.({ reject: true, reason: "cancel" });
    } catch (e) {
      console.warn("cancel outgoing failed", e);
      try {
        await callRef.current?.leave?.();
      } catch {}
    }

    callRef.current = null;
    navigate("/my-bookings", { replace: true });
  }, [navigate]);

  const handleUseSpeaker = useCallback(async () => {
    try {
      await setSinkForAllMediaElements("");
      setOutputMode("speaker");
    } catch (e) {
      console.warn("Failed to switch to default speaker output", e);
    }
  }, []);

  const handleUsePrivateOutput = useCallback(async () => {
    try {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !("selectAudioOutput" in navigator.mediaDevices)
      ) {
        console.warn("Audio output device selection is not supported here");
        return;
      }

      const selected = await (
        navigator.mediaDevices as MediaDevices & {
          selectAudioOutput: () => Promise<MediaDeviceInfo>;
        }
      ).selectAudioOutput();

      await setSinkForAllMediaElements(selected.deviceId);
      setOutputMode("private");
    } catch (e) {
      console.warn("Failed to switch private/headset output", e);
    }
  }, []);

  useEffect(() => {
    if (!user?._id || !panditId || !finalCallID) return;

    let cancelled = false;
    let localCall: any = null;
    let unsubSessionStarted: any = null;
    let unsubCallEnded: any = null;
    let unsubRejected: any = null;

    cleanedUpRef.current = false;
    setStage("preparing");
    setInitError(null);
    setCall(null);

    (async () => {
      try {
        let activeClient = useStreamClientStore.getState().client;

        if (!activeClient) {
          activeClient = await initStreamClient(
            String(user._id).trim(),
            user.name || user.userName || "User"
          );
        }

        if (!activeClient) {
          throw new Error("Stream client not available after init");
        }

        if (cancelled) return;

        localCall = activeClient.call("default", finalCallID);
        callRef.current = localCall;

        unsubSessionStarted = localCall.on("call.session_started", () => {
          if (cancelled) return;
          setStage("connected");
        });

        unsubCallEnded = localCall.on("call.ended", () => {
          if (cancelled) return;
          cleanupAndExit();
        });

        unsubRejected = localCall.on("call.rejected", () => {
          if (cancelled) return;
          cleanupAndExit();
        });

        await localCall.getOrCreate({
          ring: true,
          video: false,
          data: {
            members: [
              { user_id: String(user._id).trim() },
              { user_id: String(panditId).trim() },
            ],
            custom: {
              callerName: user.name || user.userName || "User",
              type: "audio",
            },
          },
        });

        if (cancelled) return;

        setCall(localCall);
        setStage("waiting");
      } catch (err: any) {
        if (cancelled) return;
        console.error("Failed to setup audio ring call", {
          message: err?.message,
          code: err?.code,
          status: err?.status,
          details: err,
        });
        setInitError(err?.message || "Failed to initialize audio call");
        setStage("error");
      }
    })();

    return () => {
      cancelled = true;

      try {
        unsubSessionStarted?.unsubscribe?.();
      } catch {}
      try {
        unsubCallEnded?.unsubscribe?.();
      } catch {}
      try {
        unsubRejected?.unsubscribe?.();
      } catch {}

      if (localCall) {
        localCall.leave().catch((e: any) => {
          console.warn("unmount leave failed", e);
        });
      }
    };
  }, [user?._id, user?.name, user?.userName, panditId, finalCallID, cleanupAndExit]);

  useEffect(() => {
    if (!call) return;
    if (stage === "connected") return;

    const interval = window.setInterval(() => {
      const state = call.state;

      const participantsCount =
        state?.participants
          ? Object.keys(state.participants).length
          : 0;

      if (participantsCount > 1) {
        setStage("connected");
      } else if (call) {
        setStage((prev) => (prev === "preparing" ? "waiting" : prev));
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [call, stage]);

  if (stage === "error") {
    return (
      <ErrorScreen
        message={initError || "Failed to initialize audio call"}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (stage === "preparing") {
    return <PreparingScreen />;
  }

  if (!call) {
    return <PreparingScreen />;
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0a]">
      <StreamTheme>
        <StreamCall call={call}>
          <AudioCallGate
            stage={stage}
            onExit={cleanupAndExit}
            onCancelOutgoing={cancelOutgoingAndExit}
            outputMode={outputMode}
            onUseSpeaker={handleUseSpeaker}
            onUsePrivateOutput={handleUsePrivateOutput}
          />
        </StreamCall>
      </StreamTheme>
    </div>
  );
};

export default AudioCallPage;