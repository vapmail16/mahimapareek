import { Router } from 'express';
import { body } from 'express-validator';
import * as categoryService from '../services/categoryService';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../services/rbacService';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

/**
 * GET /api/categories
 * Get all categories
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categories = await categoryService.getAll();

    res.json({
      success: true,
      data: categories,
    });
  })
);

/**
 * GET /api/categories/:slug
 * Get category by slug
 */
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const category = await categoryService.getBySlug(slug);

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Category not found',
      });
      return;
    }

    res.json({
      success: true,
      data: category,
    });
  })
);

/**
 * POST /api/categories
 * Create new category (Admin only)
 */
router.post(
  '/',
  authenticate,
  validate([
    body('name').notEmpty().withMessage('Name is required'),
    body('slug').notEmpty().withMessage('Slug is required'),
  ]),
  asyncHandler(async (req, res) => {
    // Check if user is admin
    await requireRoles(req.user!.id, ['ADMIN', 'SUPER_ADMIN']);

    const { name, slug, description } = req.body;
    const category = await categoryService.create({
      name,
      slug,
      description,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  })
);

/**
 * PUT /api/categories/:id
 * Update category (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    // Check if user is admin
    await requireRoles(req.user!.id, ['ADMIN', 'SUPER_ADMIN']);

    const { id } = req.params;
    const { name, slug, description } = req.body;

    const category = await categoryService.update(id, {
      name,
      slug,
      description,
    });

    res.json({
      success: true,
      data: category,
    });
  })
);

/**
 * DELETE /api/categories/:id
 * Delete category (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    // Check if user is admin
    await requireRoles(req.user!.id, ['ADMIN', 'SUPER_ADMIN']);

    const { id } = req.params;
    await categoryService.delete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  })
);

export default router;

