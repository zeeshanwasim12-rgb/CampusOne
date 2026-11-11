import { Router } from 'express';
import { body } from 'express-validator';
import * as facultyController from '../controllers/facultyController.js';
import { authenticate } from '../middleware/auth.js';
import { facultyOrAdmin } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Public directory (Faculty Finder).
router.get('/', facultyController.listFaculty);
router.get('/:id', facultyController.getFaculty);

// Faculty/admin can manage directory entries.
router.post(
  '/',
  authenticate,
  facultyOrAdmin,
  validate([body('name').trim().notEmpty().withMessage('Name is required')]),
  facultyController.createFaculty
);
router.patch('/:id', authenticate, facultyOrAdmin, facultyController.updateFaculty);
router.delete('/:id', authenticate, facultyOrAdmin, facultyController.deleteFaculty);

export default router;
