import { Router } from "express";
import { registerPushToken } from "../../controllers/notificfirebase/pushnotifeecontroller";


const router = Router();

router.post("/push/register", registerPushToken);

export default router;
