import { Router } from 'express';
import { body } from 'express-validator';
import * as questionPaperService from '../services/questionPaperService';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../services/rbacService';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

/**
 * GET /api/question-papers
 * Get all question papers (with optional filters)
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { educatorId, status } = req.query;

    const papers = await questionPaperService.getAll({
      ...(educatorId && { educatorId: educatorId as string }),
      ...(status && { status: status as any }),
    });

    res.json({
      success: true,
      data: papers,
    });
  })
);

/**
 * GET /api/question-papers/:id
 * Get question paper by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const paper = await questionPaperService.getById(id);

    if (!paper) {
      res.status(404).json({
        success: false,
        error: 'Question paper not found',
      });
      return;
    }

    res.json({
      success: true,
      data: paper,
    });
  })
);

/**
 * POST /api/question-papers
 * Create new question paper (Admin only)
 */
router.post(
  '/',
  authenticate,
  validate([
    body('title').notEmpty().withMessage('Title is required'),
    body('totalMarks').isInt({ min: 1 }).withMessage('Total marks must be a positive integer'),
  ]),
  asyncHandler(async (req, res) => {
    // Check if user is admin
    await requireAdmin(req.user!.id);

    const { title, description, subject, gradeLevel, totalMarks, durationMinutes, instructions, status } = req.body;

    const paper = await questionPaperService.create({
      title,
      description,
      educatorId: req.user!.id,
      subject,
      gradeLevel,
      totalMarks,
      durationMinutes,
      instructions,
      status,
    });

    res.status(201).json({
      success: true,
      data: paper,
    });
  })
);

/**
 * PUT /api/question-papers/:id
 * Update question paper (Educator who owns it or Admin)
 */
router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, subject, gradeLevel, totalMarks, durationMinutes, instructions, status } = req.body;

    const updated = await questionPaperService.update(id, {
      title,
      description,
      subject,
      gradeLevel,
      totalMarks,
      durationMinutes,
      instructions,
      status,
    }, req.user!.id);

    res.json({
      success: true,
      data: updated,
    });
  })
);

/**
 * DELETE /api/question-papers/:id
 * Delete question paper (Educator who owns it or Admin)
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await questionPaperService.delete(id, req.user!.id);

    res.json({
      success: true,
      message: 'Question paper deleted successfully',
    });
  })
);

export default router;

