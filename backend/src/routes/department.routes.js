import { Router } from 'express';
import { body } from 'express-validator';
import * as departmentController from '../controllers/departmentController.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', departmentController.listDepartments);
router.get('/:id', departmentController.getDepartment);

router.post(
  '/',
  authenticate,
  adminOnly,
  validate([body('name').trim().notEmpty(), body('code').trim().notEmpty()]),
  departmentController.createDepartment
);
router.patch('/:id', authenticate, adminOnly, departmentController.updateDepartment);
router.delete('/:id', authenticate, adminOnly, departmentController.deleteDepartment);

export default router;
