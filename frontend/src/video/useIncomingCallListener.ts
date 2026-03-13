import { useEffect } from "react";
import { useStreamClientStore } from "./streamClientStore";

export function useIncomingCallListener(onIncoming: (callId: string, callerName: string) => void) {

  const client = useStreamClientStore((s) => s.client);

  useEffect(() => {
    if (!client) return;

    const unsubscribe = client.on("call.ring", (event: any) => {

      const callId = event.call?.cid?.split(":")[1];
      const callerName = event.call?.state?.custom?.callerName || "Incoming Call";

      onIncoming(callId, callerName);
    });

    return () => unsubscribe?.();
  }, [client]);
}