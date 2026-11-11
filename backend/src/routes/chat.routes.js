import { Router } from 'express';
import { body } from 'express-validator';
import * as chatController from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(authenticate); // all chat routes require login

router.get('/rooms', chatController.listRooms);
router.post(
  '/rooms/direct',
  validate([body('userId').notEmpty().withMessage('userId is required')]),
  chatController.openDirectRoom
);
router.get('/rooms/:id/messages', chatController.getMessages);
router.post(
  '/rooms/:id/messages',
  validate([body('text').trim().notEmpty().withMessage('Message cannot be empty')]),
  chatController.sendMessage
);
router.patch('/rooms/:id/read', chatController.markRead);
router.get('/users', chatController.searchChatUsers);

export default router;
