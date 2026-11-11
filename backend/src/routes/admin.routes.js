import { Router } from 'express';
import { body } from 'express-validator';
import * as adminController from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { ROLE_VALUES } from '../utils/constants.js';

const router = Router();

router.use(authenticate, adminOnly); // every admin route is locked down here

router.get('/stats', adminController.getStats);

// Users
router.get('/users', adminController.listUsers);
router.post(
  '/users',
  validate([
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(ROLE_VALUES),
  ]),
  adminController.createUser
);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Moderation
router.get('/moderation/reported', adminController.listReportedPosts);
router.patch('/moderation/posts/:id', adminController.moderatePost);

export default router;
