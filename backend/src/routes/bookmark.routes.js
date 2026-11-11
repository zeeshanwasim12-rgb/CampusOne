import { Router } from 'express';
import * as bookmarkController from '../controllers/bookmarkController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', bookmarkController.listBookmarks);
router.post('/:resourceId', bookmarkController.toggleBookmark);

export default router;
