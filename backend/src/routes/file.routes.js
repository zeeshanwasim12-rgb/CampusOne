import { Router } from 'express';
import * as fileController from '../controllers/fileController.js';

const router = Router();

// Public read of locally-stored files (keys are URL-encoded, single segment).
router.get('/:key', fileController.serveFile);

export default router;
