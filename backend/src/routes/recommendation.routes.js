import { Router } from 'express';
import * as recommendationController from '../controllers/recommendationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, recommendationController.getRecommendations);

export default router;
