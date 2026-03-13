import type { RequestHandler } from "express";
import CallInvite from "../../model/firebaseNotification/callstatusmodel";
import { sendFcmToUser } from "../../utils/firebase/fcmservice";

function addSeconds(sec: number) {
  return new Date(Date.now() + sec * 1000);
}

type AppType = "user" | "pandit";

/** ✅ pending statuses */
const PENDING_STATUSES = new Set(["ringing", "call-ringing"]);

function normalizeInviteStatus(input: any): "ringing" | "call-ringing" {
  const s = String(input || "").trim().toLowerCase();
  return s === "call-ringing" ? "call-ringing" : "ringing";
}

function normalizeAppType(input: any): AppType | null {
  const s = String(input || "").trim().toLowerCase();
  if (s === "user" || s === "pandit") return s;
  return null;
}

/**
 * POST /api/calls/invite
 * body:
 * {
 *   toUserId, callId, callerName, callerId, bookingId?,
 *   status?,              // "ringing" | "call-ringing"
 *   fromAppType,          // "user" | "pandit"   ✅ REQUIRED
 *   toAppType             // "user" | "pandit"   ✅ REQUIRED
 * }
 */
export const inviteCall: RequestHandler = async (req, res) => {
  try {
    const fromUserId = (req as any).user?.id || (req.body as any).fromUserId;

    const {
      toUserId,
      callId,
      callerName,
      callerId,
      bookingId,
      status,
      callType,
      fromAppType: fromAppTypeRaw,
      toAppType: toAppTypeRaw,
    } = req.body as any;

    if (!fromUserId || !toUserId || !callId || !callerName || !callerId) {
      res.status(400).json({ ok: false, message: "Missing fields" });
      return;
    }

    const fromAppType = normalizeAppType(fromAppTypeRaw);
    const toAppType = normalizeAppType(toAppTypeRaw);

    if (!fromAppType || !toAppType) {
      res.status(400).json({
        ok: false,
        message: "Missing/invalid fromAppType or toAppType (user|pandit)",
      });
      return;
    }

    // ✅ backward-compatible default
    const inviteStatus = normalizeInviteStatus(status);
    const resolvedCallType = (callType === "audio") ? "audio" : "video";

    const expiresAt = addSeconds(45);

    await CallInvite.findOneAndUpdate(
      { callId: String(callId) },
      {
        callId: String(callId),
        fromUserId: String(fromUserId),
        toUserId: String(toUserId),

        // ✅ NEW: persist app direction for accept/reject/cancel routing
        fromAppType,
        toAppType,

        callerName: String(callerName),
        callerId: String(callerId),
        bookingId: bookingId ?? null,
        status: inviteStatus,
        callType: resolvedCallType,
        expiresAt,
      },
      { upsert: true, new: true }
    );

    console.log("FCM invite record created", {
      callId,
      toUserId,
      toAppType,
      status: inviteStatus,
      callType: resolvedCallType,
    });

    const pushResult = await sendFcmToUser({
      userId: String(toUserId),
      appType: toAppType, // ✅ critical fix for separate firebase projects
      androidOnly: true,
      ttlSeconds: 60,
      data: {
        type: "INCOMING_CALL",
        callId,
        callerName,
        callerId,
        bookingId: bookingId ?? "",
        status: inviteStatus, // ✅ "ringing" or "call-ringing"
        callType: resolvedCallType,
      },
    });

    console.log("invite status", inviteStatus);
    console.log("push result", pushResult);

    res.json({ ok: true, pushResult });
  } catch (e: any) {
    console.error("[inviteCall] error:", e);
    res.status(500).json({ ok: false, message: e?.message || "Invite failed" });
  }
};

/**
 * POST /api/calls/:callId/accept
 */
export const acceptCall: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id || (req.body as any).userId;
    const { callId } = req.params;

    const invite: any = await CallInvite.findOne({ callId });
    if (!invite) {
      res.status(404).json({ ok: false, message: "Invite not found" });
      return;
    }

    if (String(invite.toUserId) !== String(userId)) {
      res.status(403).json({ ok: false, message: "Not allowed" });
      return;
    }

    if (!PENDING_STATUSES.has(String(invite.status))) {
      res.status(409).json({ ok: false, message: `Call already ${invite.status}` });
      return;
    }

    invite.status = "accepted";
    await invite.save();

    // ✅ send back to caller using caller's appType
    await sendFcmToUser({
      userId: String(invite.fromUserId),
      appType: (invite.fromAppType as AppType) || "pandit",
      ttlSeconds: 60,
      data: { type: "CALL_ACCEPTED", callId, byUserId: String(invite.toUserId) },
    });

    res.json({ ok: true });
  } catch (e: any) {
    console.error("[acceptCall] error:", e);
    res.status(500).json({ ok: false, message: e?.message || "Accept failed" });
  }
};

/**
 * POST /api/calls/:callId/reject
 */
export const rejectCall: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id || (req.body as any).userId;
    const { callId } = req.params;

    const invite: any = await CallInvite.findOne({ callId });
    if (!invite) {
      res.status(404).json({ ok: false, message: "Invite not found" });
      return;
    }

    if (String(invite.toUserId) !== String(userId)) {
      res.status(403).json({ ok: false, message: "Not allowed" });
      return;
    }

    if (!PENDING_STATUSES.has(String(invite.status))) {
      res.status(409).json({ ok: false, message: `Call already ${invite.status}` });
      return;
    }

    invite.status = "rejected";
    await invite.save();

    // ✅ send back to caller using caller's appType
    await sendFcmToUser({
      userId: String(invite.fromUserId),
      appType: (invite.fromAppType as AppType) || "pandit",
      ttlSeconds: 60,
      data: { type: "CALL_REJECTED", callId, byUserId: String(invite.toUserId) },
    });

    res.json({ ok: true });
  } catch (e: any) {
    console.error("[rejectCall] error:", e);
    res.status(500).json({ ok: false, message: e?.message || "Reject failed" });
  }
};

/**
 * POST /api/calls/:callId/cancel
 */
export const cancelCall: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id || (req.body as any).userId;
    const { callId } = req.params;

    const invite: any = await CallInvite.findOne({ callId });
    if (!invite) {
      res.status(404).json({ ok: false, message: "Invite not found" });
      return;
    }

    if (String(invite.fromUserId) !== String(userId)) {
      res.status(403).json({ ok: false, message: "Not allowed" });
      return;
    }

    if (!PENDING_STATUSES.has(String(invite.status))) {
      res.status(409).json({ ok: false, message: `Call already ${invite.status}` });
      return;
    }

    invite.status = "canceled";
    await invite.save();

    // ✅ send cancel to receiver using receiver's appType
    await sendFcmToUser({
      userId: String(invite.toUserId),
      appType: (invite.toAppType as AppType) || "user",
      androidOnly: true,
      ttlSeconds: 60,
      data: { type: "CALL_CANCELED", callId, byUserId: String(invite.fromUserId) },
    });

    res.json({ ok: true });
  } catch (e: any) {
    console.error("[cancelCall] error:", e);
    res.status(500).json({ ok: false, message: e?.message || "Cancel failed" });
  }
};