import { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(authenticate); // everything here requires login

router.get('/me', userController.getMe);
router.patch(
  '/me',
  validate([
    body('name').optional().trim().notEmpty(),
    body('semester').optional().isInt({ min: 1, max: 10 }),
    body('subjects').optional().isArray(),
  ]),
  userController.updateMe
);
router.patch(
  '/me/password',
  validate([
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ]),
  userController.changePassword
);

export default router;
