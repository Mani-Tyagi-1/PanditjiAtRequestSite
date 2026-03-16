import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CallControls,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

import { useAuth } from "../context/AuthContext";
import { initStreamClient } from "./initStreamClient";
import { useStreamClientStore } from "./streamClientStore";

type ScreenStage = "preparing" | "waiting" | "connected" | "error";

function PreparingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FFFAF5]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#FF7000] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Preparing Call...</p>
      </div>
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
    <div className="flex items-center justify-center min-h-screen bg-[#FFFAF5]">
      <div className="text-center">
        <p className="text-red-600 mb-4">{message}</p>
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-full bg-[#FF7000] text-white font-semibold"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function WaitingScreen({
  secondsLeft,
  onCancel,
}: {
  secondsLeft: number;
  onCancel: () => void;
}) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center px-6">
      <div className="text-center max-w-md w-full">
        <div className="w-14 h-14 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h1 className="text-white text-2xl font-bold mb-2">Ringing...</h1>
        <p className="text-white/70 text-sm mb-3">
          Waiting for the other participant to join
        </p>
        <p className="text-white font-semibold text-lg mb-8">
          Time left: {mins}:{secs.toString().padStart(2, "0")}
        </p>

        <button
          onClick={onCancel}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-full"
        >
          End Call
        </button>
      </div>
    </div>
  );
}

function LiveCall({ onExit }: { onExit: () => void }) {
  const call = useCall();

  return (
    <StreamTheme>
      <div className="h-screen w-full bg-black">
        <SpeakerLayout />
        <CallControls
          onLeave={async () => {
            try {
              await call?.leave();
            } catch (e) {
              console.warn("leave failed", e);
            }
            onExit();
          }}
        />
      </div>
    </StreamTheme>
  );
}

function CallGate({
  stage,
  onExit,
  onCancelOutgoing,
}: {
  stage: ScreenStage;
  onExit: () => void;
  onCancelOutgoing: () => Promise<void>;
}) {
  const call = useCall();
  const { useRemoteParticipants } = useCallStateHooks();
  const remoteParticipants = useRemoteParticipants();

  const [secondsLeft, setSecondsLeft] = useState(60);
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const remoteJoinedOnceRef = useRef(false);

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
    if (remoteParticipants.length > 0 || stage === "connected") {
      remoteJoinedOnceRef.current = true;
      clearTimers();
    }
  }, [remoteParticipants.length, stage, clearTimers]);

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

  useEffect(() => {
    const watcher = window.setInterval(async () => {
      if (
        remoteJoinedOnceRef.current &&
        remoteParticipants.length === 0 &&
        stage !== "connected"
      ) {
        try {
          await call?.leave();
        } catch (e) {
          console.warn("leave after remote left failed", e);
        }
        onExit();
      }
    }, 3000);

    return () => window.clearInterval(watcher);
  }, [remoteParticipants.length, stage, call, onExit]);

  if (stage === "connected") {
    return <LiveCall onExit={onExit} />;
  }

  return (
    <WaitingScreen
      secondsLeft={secondsLeft}
      onCancel={onCancelOutgoing}
    />
  );
}

const VideoCallPage = () => {
  const { callId, panditId } = useParams<{
    callId: string;
    panditId: string;
  }>();

  const { user } = useAuth();
  const navigate = useNavigate();

  const [call, setCall] = useState<any>(null);
  const [stage, setStage] = useState<ScreenStage>("preparing");
  const [initError, setInitError] = useState<string | null>(null);

  const callRef = useRef<any>(null);
  const cleanedUpRef = useRef(false);

  const finalCallID = useMemo(
    () => `${callId || ""}_VC`,
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
          video: true,
          data: {
            members: [
              { user_id: String(user._id).trim() },
              { user_id: String(panditId).trim() },
            ],
            custom: {
              callerName: user.name || user.userName || "User",
              type: "video",
            },
          },
        });

        if (cancelled) return;

        setCall(localCall);
        setStage("waiting");
      } catch (err: any) {
        if (cancelled) return;
        console.error("Failed to setup video ring call", {
          message: err?.message,
          code: err?.code,
          status: err?.status,
          details: err,
        });
        setInitError(err?.message || "Failed to initialize video call");
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

      const participantsCount = state?.participants
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
        message={initError || "Failed to initialize video call"}
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
    <StreamCall call={call}>
      <CallGate
        stage={stage}
        onExit={cleanupAndExit}
        onCancelOutgoing={cancelOutgoingAndExit}
      />
    </StreamCall>
  );
};

export default VideoCallPage;