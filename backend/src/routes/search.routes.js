import { Router } from 'express';
import * as searchController from '../controllers/searchController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, searchController.globalSearch);

export default router;
