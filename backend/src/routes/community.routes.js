import { Router } from 'express';
import { body } from 'express-validator';
import * as communityController from '../controllers/communityController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { COMMUNITY_CATEGORIES } from '../utils/constants.js';

const router = Router();

router.get('/posts', optionalAuth, communityController.listPosts);
router.get('/posts/:id', optionalAuth, communityController.getPost);

router.post(
  '/posts',
  authenticate,
  validate([
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('body').trim().notEmpty().withMessage('Body is required').isLength({ max: 5000 }),
    body('category').optional().isIn(COMMUNITY_CATEGORIES),
  ]),
  communityController.createPost
);
router.delete('/posts/:id', authenticate, communityController.deletePost);
router.post('/posts/:id/like', authenticate, communityController.toggleLike);
router.post('/posts/:id/report', authenticate, communityController.reportPost);

// Comments
router.get('/posts/:id/comments', communityController.listComments);
router.post(
  '/posts/:id/comments',
  authenticate,
  validate([body('body').trim().notEmpty().withMessage('Comment cannot be empty')]),
  communityController.createComment
);
router.delete('/posts/:id/comments/:commentId', authenticate, communityController.deleteComment);

export default router;
