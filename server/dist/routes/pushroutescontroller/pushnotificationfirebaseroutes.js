"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pushnotifeecontroller_1 = require("../../controller/notificfirebase/pushnotifeecontroller");
const router = (0, express_1.Router)();
router.post("/push/register", pushnotifeecontroller_1.registerPushToken);
exports.default = router;
