import { Router } from "express";
import { acceptCall, cancelCall, inviteCall, rejectCall } from "../../controller/notificfirebase/callnotificcontroller";

const router = Router();

router.post("/api/calls/invite", inviteCall);
router.post("/api/calls/:callId/accept", acceptCall);
router.post("/api/calls/:callId/reject", rejectCall);
router.post("/api/calls/:callId/cancel", cancelCall);

export default router;