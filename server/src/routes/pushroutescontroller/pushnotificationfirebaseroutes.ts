import { Router } from "express";
import { registerPushToken } from "../../controller/notificfirebase/pushnotifeecontroller";


const router = Router();

router.post("/api/push/register", registerPushToken);

export default router;