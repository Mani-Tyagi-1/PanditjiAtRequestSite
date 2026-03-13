// routes/debug.ts
import { Router } from 'express';
import { genStreamToken } from '../../utils/genStreamToken';


const router = Router();

router.get("/gen-stream-token/:id" ,genStreamToken );

export default router;
