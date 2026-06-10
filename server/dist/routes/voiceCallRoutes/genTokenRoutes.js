"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/debug.ts
const express_1 = require("express");
const genStreamToken_1 = require("../../utils/genStreamToken");
const router = (0, express_1.Router)();
router.get("/gen-stream-token/:id", genStreamToken_1.genStreamToken);
exports.default = router;
