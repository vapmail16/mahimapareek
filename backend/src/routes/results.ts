import { Router } from 'express';
import * as resultsService from '../services/resultsService';
import * as exportService from '../services/exportService';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../services/rbacService';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

/**
 * GET /api/results/:answerPaperId
 * Get detailed result for an answer paper
 */
router.get(
  '/:answerPaperId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { answerPaperId } = req.params;

    const result = await resultsService.getResult(answerPaperId, req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/results/student/:studentId
 * Get all results for a student
 */
router.get(
  '/student/:studentId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    // Authorization: students can only see their own results
    if (req.user!.role === 'STUDENT' && studentId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'You can only view your own results',
      });
      return;
    }

    const results = await resultsService.getStudentResults(studentId);

    res.json({
      success: true,
      data: results,
    });
  })
);

/**
 * GET /api/results/question-paper/:questionPaperId
 * Get all results for a question paper (Educator only)
 */
router.get(
  '/question-paper/:questionPaperId',
  authenticate,
  asyncHandler(async (req, res) => {
    // Check if user is educator or admin
    await requireRoles(req.user!.id, ['EDUCATOR', 'ADMIN', 'SUPER_ADMIN']);

    const { questionPaperId } = req.params;

    const results = await resultsService.getQuestionPaperResults(questionPaperId, req.user!.id);

    res.json({
      success: true,
      data: results,
    });
  })
);

/**
 * GET /api/results/student/:studentId/summary
 * Get performance summary for a student
 */
router.get(
  '/student/:studentId/summary',
  authenticate,
  asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    // Authorization: students can only see their own summary
    if (req.user!.role === 'STUDENT' && studentId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'You can only view your own performance summary',
      });
      return;
    }

    const summary = await resultsService.getPerformanceSummary(studentId);

    res.json({
      success: true,
      data: summary,
    });
  })
);

/**
 * GET /api/results/question-paper/:questionPaperId/distribution
 * Get grade distribution for a question paper (Educator only)
 */
router.get(
  '/question-paper/:questionPaperId/distribution',
  authenticate,
  asyncHandler(async (req, res) => {
    // Check if user is educator or admin
    await requireRoles(req.user!.id, ['EDUCATOR', 'ADMIN', 'SUPER_ADMIN']);

    const { questionPaperId } = req.params;

    const distribution = await resultsService.getGradeDistribution(questionPaperId, req.user!.id);

    res.json({
      success: true,
      data: distribution,
    });
  })
);

/**
 * GET /api/results/:answerPaperId/export/csv
 * Export result as CSV
 */
router.get(
  '/:answerPaperId/export/csv',
  authenticate,
  asyncHandler(async (req, res) => {
    const { answerPaperId } = req.params;

    const csv = await exportService.exportResultToCSV(answerPaperId, req.user!.id);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="result-${answerPaperId}.csv"`);
    res.send(csv);
  })
);

/**
 * GET /api/results/question-paper/:questionPaperId/export/csv
 * Export all results for a question paper as CSV (Educator only)
 */
router.get(
  '/question-paper/:questionPaperId/export/csv',
  authenticate,
  asyncHandler(async (req, res) => {
    // Check if user is educator or admin
    await requireRoles(req.user!.id, ['EDUCATOR', 'ADMIN', 'SUPER_ADMIN']);

    const { questionPaperId } = req.params;

    const csv = await exportService.exportQuestionPaperResultsToCSV(questionPaperId, req.user!.id);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="results-${questionPaperId}.csv"`);
    res.send(csv);
  })
);

export default router;

