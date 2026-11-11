import { Router } from 'express';
import { body } from 'express-validator';
import * as eventController from '../controllers/eventController.js';
import { authenticate } from '../middleware/auth.js';
import { facultyOrAdmin } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', eventController.listEvents);
router.get('/:id', eventController.getEvent);

router.post(
  '/',
  authenticate,
  facultyOrAdmin,
  validate([
    body('name').trim().notEmpty().withMessage('Event name is required'),
    body('startAt').notEmpty().isISO8601().withMessage('Valid start date/time is required'),
  ]),
  eventController.createEvent
);
router.patch('/:id', authenticate, facultyOrAdmin, eventController.updateEvent);
router.delete('/:id', authenticate, facultyOrAdmin, eventController.deleteEvent);
router.post('/:id/register', authenticate, eventController.toggleRegister);

export default router;
