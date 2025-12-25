import { Router } from 'express';
import { body } from 'express-validator';
import * as gradingService from '../services/gradingService';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../services/rbacService';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

/**
 * POST /api/grading/mcq/:questionId
 * Grade an MCQ answer
 */
router.post(
  '/mcq/:questionId',
  authenticate,
  validate([
    body('answer').notEmpty().withMessage('Answer is required'),
    body('answerPaperId').notEmpty().withMessage('Answer paper ID is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const { answer, answerPaperId } = req.body;

    const result = await gradingService.gradeMCQ(questionId, answer, answerPaperId);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/grading/short-answer/:questionId
 * Grade a short answer
 */
router.post(
  '/short-answer/:questionId',
  authenticate,
  validate([
    body('answer').notEmpty().withMessage('Answer is required'),
    body('answerPaperId').notEmpty().withMessage('Answer paper ID is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const { answer, answerPaperId } = req.body;

    const result = await gradingService.gradeShortAnswer(questionId, answer, answerPaperId);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/grading/long-answer/:questionId
 * Grade a long answer (AI-powered)
 */
router.post(
  '/long-answer/:questionId',
  authenticate,
  validate([
    body('answer').notEmpty().withMessage('Answer is required'),
    body('answerPaperId').notEmpty().withMessage('Answer paper ID is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const { answer, answerPaperId } = req.body;

    const result = await gradingService.gradeLongAnswer(questionId, answer, answerPaperId);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/grading/paper/:answerPaperId
 * Grade entire answer paper (Educator/Admin only)
 */
router.post(
  '/paper/:answerPaperId',
  authenticate,
  asyncHandler(async (req, res) => {
    // Check if user is educator or admin
    await requireRoles(req.user!.id, ['EDUCATOR', 'ADMIN', 'SUPER_ADMIN']);

    const { answerPaperId } = req.params;

    const result = await gradingService.gradeAnswerPaper(answerPaperId, req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;

