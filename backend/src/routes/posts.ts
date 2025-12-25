import { Router } from 'express';
import { body } from 'express-validator';
import * as postService from '../services/postService';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../services/rbacService';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

/**
 * GET /api/posts
 * Get all posts (with optional filters)
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, categoryId, authorId } = req.query;

    const posts = await postService.getAll({
      ...(status && { status: status as any }),
      ...(categoryId && { categoryId: categoryId as string }),
      ...(authorId && { authorId: authorId as string }),
    });

    res.json({
      success: true,
      data: posts,
    });
  })
);

/**
 * GET /api/posts/:slug
 * Get post by slug
 */
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const post = await postService.getBySlug(slug);

    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Post not found',
      });
      return;
    }

    res.json({
      success: true,
      data: post,
    });
  })
);

/**
 * POST /api/posts
 * Create new post (Authenticated users)
 */
router.post(
  '/',
  authenticate,
  validate([
    body('title').notEmpty().withMessage('Title is required'),
    body('slug').notEmpty().withMessage('Slug is required'),
    body('content').notEmpty().withMessage('Content is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { title, slug, content, excerpt, categoryId, status } = req.body;

    const post = await postService.create({
      title,
      slug,
      content,
      excerpt,
      authorId: req.user!.id,
      categoryId,
      status,
    });

    res.status(201).json({
      success: true,
      data: post,
    });
  })
);

/**
 * PUT /api/posts/:id
 * Update post (Author or Admin only)
 */
router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, slug, content, excerpt, categoryId, status } = req.body;

    // Check if user is author or admin
    const post = await postService.getById(id);
    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Post not found',
      });
      return;
    }

    const isAuthor = post.authorId === req.user!.id;
    const isAdmin = await requireRoles(req.user!.id, ['ADMIN', 'SUPER_ADMIN']).then(() => true).catch(() => false);

    if (!isAuthor && !isAdmin) {
      res.status(403).json({
        success: false,
        error: 'You can only edit your own posts',
      });
      return;
    }

    const updated = await postService.update(id, {
      title,
      slug,
      content,
      excerpt,
      categoryId,
      status,
    });

    res.json({
      success: true,
      data: updated,
    });
  })
);

/**
 * DELETE /api/posts/:id
 * Delete post (Author or Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user is author or admin
    const post = await postService.getById(id);
    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Post not found',
      });
      return;
    }

    const isAuthor = post.authorId === req.user!.id;
    const isAdmin = await requireRoles(req.user!.id, ['ADMIN', 'SUPER_ADMIN']).then(() => true).catch(() => false);

    if (!isAuthor && !isAdmin) {
      res.status(403).json({
        success: false,
        error: 'You can only delete your own posts',
      });
      return;
    }

    await postService.delete(id);

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  })
);

export default router;

