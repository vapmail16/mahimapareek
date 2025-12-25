import { Router } from 'express';
import { body } from 'express-validator';
import * as questionService from '../services/questionService';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../services/rbacService';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

/**
 * GET /api/question-papers/:paperId/questions
 * Get all questions for a question paper
 */
router.get(
  '/paper/:paperId',
  asyncHandler(async (req, res) => {
    const { paperId } = req.params;

    const questions = await questionService.getAll(paperId);

    res.json({
      success: true,
      data: questions,
    });
  })
);

/**
 * GET /api/questions/:id
 * Get question by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const question = await questionService.getById(id);

    if (!question) {
      res.status(404).json({
        success: false,
        error: 'Question not found',
      });
      return;
    }

    res.json({
      success: true,
      data: question,
    });
  })
);

/**
 * POST /api/question-papers/:paperId/questions
 * Create new question (Educator who owns the paper)
 */
router.post(
  '/paper/:paperId',
  authenticate,
  validate([
    body('questionText').notEmpty().withMessage('Question text is required'),
    body('questionType').isIn(['MCQ', 'SHORT_ANSWER', 'LONG_ANSWER', 'ESSAY']).withMessage('Invalid question type'),
    body('marks').isInt({ min: 1 }).withMessage('Marks must be a positive integer'),
  ]),
  asyncHandler(async (req, res) => {
    // Check if user is educator
    await requireRoles(req.user!.id, ['EDUCATOR', 'ADMIN', 'SUPER_ADMIN']);

    const { paperId } = req.params;
    const { questionNumber, questionText, questionType, marks, correctAnswer, answerKeywords, modelAnswer, options } = req.body;

    const question = await questionService.create({
      questionPaperId: paperId,
      questionNumber,
      questionText,
      questionType,
      marks,
      correctAnswer,
      answerKeywords,
      modelAnswer,
      options,
    }, req.user!.id);

    res.status(201).json({
      success: true,
      data: question,
    });
  })
);

/**
 * PUT /api/questions/:id
 * Update question (Educator who owns the paper or Admin)
 */
router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { questionNumber, questionText, questionType, marks, correctAnswer, answerKeywords, modelAnswer, options } = req.body;

    const updated = await questionService.update(id, {
      questionNumber,
      questionText,
      questionType,
      marks,
      correctAnswer,
      answerKeywords,
      modelAnswer,
      options,
    }, req.user!.id);

    res.json({
      success: true,
      data: updated,
    });
  })
);

/**
 * DELETE /api/questions/:id
 * Delete question (Educator who owns the paper or Admin)
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await questionService.delete(id, req.user!.id);

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  })
);

export default router;

