import { Router } from 'express';
import authRoutes from './auth';
import healthRoutes from './health';
import notificationRoutes from './notifications';
import auditRoutes from './audit';
import rbacRoutes from './rbac';
import paymentRoutes from './payments';
import gdprRoutes from './gdpr';
import categoryRoutes from './categories';
import postRoutes from './posts';
import questionPaperRoutes from './questionPapers';
import questionRoutes from './questions';
import answerPaperRoutes from './answerPapers';
import gradingRoutes from './grading';
import resultsRoutes from './results';

const router = Router();

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);
router.use('/rbac', rbacRoutes);
router.use('/payments', paymentRoutes);
router.use('/gdpr', gdprRoutes);
router.use('/categories', categoryRoutes);
router.use('/posts', postRoutes);
router.use('/question-papers', questionPaperRoutes);
router.use('/questions', questionRoutes);
router.use('/answer-papers', answerPaperRoutes);
router.use('/grading', gradingRoutes);
router.use('/results', resultsRoutes);

// Root endpoint
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Mahimapareek.com API',
    version: '1.0.0',
  });
});

export default router;

