import { Router } from 'express';
import { body } from 'express-validator';
import * as campusController from '../controllers/campusController.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { LOCATION_TYPE_VALUES } from '../utils/constants.js';

const router = Router();

router.get('/', campusController.listLocations);
router.get('/:id', campusController.getLocation);

router.post(
  '/',
  authenticate,
  adminOnly,
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('type').isIn(LOCATION_TYPE_VALUES).withMessage('Invalid location type'),
  ]),
  campusController.createLocation
);
router.patch('/:id', authenticate, adminOnly, campusController.updateLocation);
router.delete('/:id', authenticate, adminOnly, campusController.deleteLocation);

export default router;
