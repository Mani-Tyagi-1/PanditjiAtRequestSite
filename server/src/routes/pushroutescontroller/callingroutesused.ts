import { Router } from "express";
import { acceptCall, cancelCall, inviteCall, rejectCall } from "../../controller/notificfirebase/callnotificcontroller";

const router = Router();

router.post("/invite", inviteCall);
router.post("/:callId/accept", acceptCall);
router.post("/:callId/reject", rejectCall);
router.post("/:callId/cancel", cancelCall);

export default router;