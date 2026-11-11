import { Router } from 'express';
import { body } from 'express-validator';
import * as resourceController from '../controllers/resourceController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { upload, handleUploadErrors } from '../middleware/upload.js';
import { RESOURCE_TYPE_VALUES } from '../utils/constants.js';

const router = Router();

// Public browse/search (personalized when logged in).
router.get('/', optionalAuth, resourceController.listResources);
router.get('/:id', optionalAuth, resourceController.getResource);

// Any signed-in user can upload; students land in the moderation queue.
router.post(
  '/',
  authenticate,
  upload.single('file'),
  handleUploadErrors,
  validate([
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('type').isIn(RESOURCE_TYPE_VALUES).withMessage('Invalid resource type'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
  ]),
  resourceController.createResource
);

router.patch('/:id', authenticate, resourceController.updateResource);
router.delete('/:id', authenticate, resourceController.deleteResource);

router.get('/:id/download', authenticate, resourceController.downloadResource);
router.patch('/:id/moderate', authenticate, adminOnly, resourceController.moderateResource);

export default router;
