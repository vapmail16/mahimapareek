import { Router } from 'express';
import { body } from 'express-validator';
import * as answerPaperService from '../services/answerPaperService';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../services/rbacService';
import asyncHandler from '../utils/asyncHandler';
import { upload, getFileType, getFileSize } from '../utils/fileUpload';

const router = Router();

/**
 * GET /api/answer-papers
 * Get all answer papers (with optional filters)
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { studentId, questionPaperId, status } = req.query;

    // Students can only see their own papers
    const filters: any = {};
    if (req.user!.role === 'STUDENT') {
      filters.studentId = req.user!.id;
    } else {
      if (studentId) filters.studentId = studentId as string;
      if (questionPaperId) filters.questionPaperId = questionPaperId as string;
      if (status) filters.status = status as any;
    }

    const papers = await answerPaperService.getAll(filters);

    res.json({
      success: true,
      data: papers,
    });
  })
);

/**
 * GET /api/answer-papers/:id
 * Get answer paper by ID
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const paper = await answerPaperService.getById(id);

    if (!paper) {
      res.status(404).json({
        success: false,
        error: 'Answer paper not found',
      });
      return;
    }

    // Authorization: students can only see their own papers
    if (req.user!.role === 'STUDENT' && paper.studentId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'You can only view your own answer papers',
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
 * GET /api/answer-papers/student/:studentId
 * Get answer papers by student (Educator/Admin only)
 */
router.get(
  '/student/:studentId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    // Only educators and admins can view any student's papers
    if (req.user!.role === 'STUDENT' && studentId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'You can only view your own answer papers',
      });
      return;
    }

    const papers = await answerPaperService.getByStudent(studentId);

    res.json({
      success: true,
      data: papers,
    });
  })
);

/**
 * POST /api/answer-papers
 * Create new answer paper submission (Student only)
 */
router.post(
  '/',
  authenticate,
  validate([
    body('questionPaperId').notEmpty().withMessage('Question paper ID is required'),
  ]),
  asyncHandler(async (req, res) => {
    // Check if user is student
    await requireRoles(req.user!.id, ['STUDENT', 'ADMIN', 'SUPER_ADMIN']);

    const { questionPaperId } = req.body;

    const paper = await answerPaperService.create({
      questionPaperId,
      studentId: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: paper,
    });
  })
);

/**
 * POST /api/answer-papers/:id/files
 * Upload files to answer paper (Student who owns it)
 */
router.post(
  '/:id/files',
  authenticate,
  upload.array('files', 10),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
      return;
    }

    // Check if answer paper exists and user owns it
    const answerPaper = await answerPaperService.getById(id);
    if (!answerPaper) {
      res.status(404).json({
        success: false,
        error: 'Answer paper not found',
      });
      return;
    }

    // Authorization: only student who owns the paper can upload files
    if (req.user!.role === 'STUDENT' && answerPaper.studentId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'You can only upload files to your own answer papers',
      });
      return;
    }

    // Add files to answer paper
    const uploadedFiles = [];
    for (const file of files) {
      const fileData = await answerPaperService.addFile(id, {
        fileName: file.originalname,
        filePath: file.path,
        fileType: getFileType(file.filename),
        fileSize: getFileSize(file.path),
      });
      uploadedFiles.push(fileData);
    }

    res.status(201).json({
      success: true,
      data: uploadedFiles,
    });
  })
);

/**
 * GET /api/answer-papers/:id/files
 * Get all files for an answer paper
 */
router.get(
  '/:id/files',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if answer paper exists
    const answerPaper = await answerPaperService.getById(id);
    if (!answerPaper) {
      res.status(404).json({
        success: false,
        error: 'Answer paper not found',
      });
      return;
    }

    // Authorization: students can only see their own files
    if (req.user!.role === 'STUDENT' && answerPaper.studentId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'You can only view files for your own answer papers',
      });
      return;
    }

    const files = await answerPaperService.getFiles(id);

    res.json({
      success: true,
      data: files,
    });
  })
);

/**
 * PUT /api/answer-papers/:id/status
 * Update answer paper status (Educator/Admin only)
 */
router.put(
  '/:id/status',
  authenticate,
  validate([
    body('status').isIn(['SUBMITTED', 'GRADING', 'GRADED', 'REVIEWED']).withMessage('Invalid status'),
  ]),
  asyncHandler(async (req, res) => {
    // Check if user is educator or admin
    await requireRoles(req.user!.id, ['EDUCATOR', 'ADMIN', 'SUPER_ADMIN']);

    const { id } = req.params;
    const { status, totalMarksObtained, percentage, grade, feedback } = req.body;

    const updated = await answerPaperService.updateStatus(
      id,
      status,
      req.user!.id,
      {
        totalMarksObtained,
        percentage,
        grade,
        feedback,
      }
    );

    res.json({
      success: true,
      data: updated,
    });
  })
);

/**
 * DELETE /api/answer-papers/:id/files/:fileId
 * Delete a file from answer paper
 */
router.delete(
  '/:id/files/:fileId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id, fileId } = req.params;

    // Check if answer paper exists
    const answerPaper = await answerPaperService.getById(id);
    if (!answerPaper) {
      res.status(404).json({
        success: false,
        error: 'Answer paper not found',
      });
      return;
    }

    // Authorization: only student who owns the paper can delete files
    if (req.user!.role === 'STUDENT' && answerPaper.studentId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'You can only delete files from your own answer papers',
      });
      return;
    }

    await answerPaperService.deleteFile(fileId);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  })
);

export default router;

