/**
 * Mounts every feature router under a clear /api/<resource> prefix.
 * The health check is handy for load balancers / AWS target groups.
 */
import { Router } from 'express';
import { effectiveAuthProvider, effectiveStorageDriver } from '../config/env.js';

import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import departmentRoutes from './department.routes.js';
import facultyRoutes from './faculty.routes.js';
import campusRoutes from './campus.routes.js';
import resourceRoutes from './resource.routes.js';
import noticeRoutes from './notice.routes.js';
import eventRoutes from './event.routes.js';
import communityRoutes from './community.routes.js';
import chatRoutes from './chat.routes.js';
import notificationRoutes from './notification.routes.js';
import bookmarkRoutes from './bookmark.routes.js';
import recommendationRoutes from './recommendation.routes.js';
import searchRoutes from './search.routes.js';
import adminRoutes from './admin.routes.js';
import fileRoutes from './file.routes.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({
    success: true,
    status: 'ok',
    time: new Date().toISOString(),
    authProvider: effectiveAuthProvider(),
    storageDriver: effectiveStorageDriver(),
  })
);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/faculty', facultyRoutes);
router.use('/campus', campusRoutes);
router.use('/resources', resourceRoutes);
router.use('/notices', noticeRoutes);
router.use('/events', eventRoutes);
router.use('/community', communityRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);
router.use('/files', fileRoutes);

export default router;
