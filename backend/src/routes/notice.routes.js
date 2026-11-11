import { Router } from 'express';
import { body } from 'express-validator';
import * as noticeController from '../controllers/noticeController.js';
import { authenticate } from '../middleware/auth.js';
import { facultyOrAdmin } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { upload, handleUploadErrors } from '../middleware/upload.js';

const router = Router();

router.get('/', noticeController.listNotices);
router.get('/:id', noticeController.getNotice);

router.post(
  '/',
  authenticate,
  facultyOrAdmin,
  upload.single('attachment'),
  handleUploadErrors,
  validate([
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ]),
  noticeController.createNotice
);
router.patch('/:id', authenticate, facultyOrAdmin, noticeController.updateNotice);
router.delete('/:id', authenticate, facultyOrAdmin, noticeController.deleteNotice);

export default router;
