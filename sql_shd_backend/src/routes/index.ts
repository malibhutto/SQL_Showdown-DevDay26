import { Router } from 'express';
import authRoutes from './auth.routes';
import questionRoutes from './question.routes';
import executionRoutes from './execution.routes';
import competitionRoutes from './competition.routes';
import submissionRoutes from './submission.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/questions', questionRoutes);
router.use('/run', executionRoutes);
router.use('/competition', competitionRoutes);
router.use('/submissions', submissionRoutes);
router.use('/admin', adminRoutes);

export default router;
