import { prisma } from '../config/database';
import { Post, PostStatus, Prisma } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export interface CreatePostDto {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  authorId: string;
  categoryId?: string;
  status?: PostStatus;
}

export interface UpdatePostDto {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  categoryId?: string;
  status?: PostStatus;
}

export interface PostFilters {
  status?: PostStatus;
  categoryId?: string;
  authorId?: string;
}

/**
 * Create a new post
 */
export const create = async (data: CreatePostDto): Promise<Post> => {
  // Validation
  if (!data.title || !data.slug || !data.content) {
    throw new ValidationError('Title, slug, and content are required');
  }

  // Check if author exists
  const author = await prisma.user.findUnique({
    where: { id: data.authorId }
  });

  if (!author) {
    throw new NotFoundError('Author not found');
  }

  // Check if category exists (if provided)
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId }
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }
  }

  // Check for duplicate slug
  const existing = await prisma.post.findUnique({
    where: { slug: data.slug }
  });

  if (existing) {
    throw new ValidationError('Post with this slug already exists');
  }

  try {
    const postData: Prisma.PostCreateInput = {
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt || null,
      author: {
        connect: { id: data.authorId }
      },
      status: data.status || 'DRAFT',
      ...(data.status === 'PUBLISHED' && {
        publishedAt: new Date()
      }),
      ...(data.categoryId && {
        category: {
          connect: { id: data.categoryId }
        }
      })
    };

    const post = await prisma.post.create({
      data: postData
    });

    logger.info('Post created', {
      postId: post.id,
      title: post.title,
      slug: post.slug,
      authorId: data.authorId
    });

    return post;
  } catch (error: any) {
    logger.error('Failed to create post', {
      error: error.message,
      title: data.title,
      authorId: data.authorId
    });
    throw error;
  }
};

/**
 * Get all posts with optional filters
 */
export const getAll = async (filters?: PostFilters): Promise<Post[]> => {
  const where: Prisma.PostWhereInput = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters?.authorId) {
    where.authorId = filters.authorId;
  }

  return await prisma.post.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    }
  });
};

/**
 * Get post by slug
 */
export const getBySlug = async (slug: string): Promise<Post | null> => {
  return await prisma.post.findUnique({
    where: { slug }
  });
};

/**
 * Get post by ID
 */
export const getById = async (id: string): Promise<Post | null> => {
  return await prisma.post.findUnique({
    where: { id }
  });
};

/**
 * Update post
 */
export const update = async (
  id: string,
  data: UpdatePostDto
): Promise<Post> => {
  // Check if post exists
  const existing = await getById(id);
  if (!existing) {
    throw new NotFoundError('Post not found');
  }

  // Check for duplicate slug if updating
  if (data.slug && data.slug !== existing.slug) {
    const duplicate = await prisma.post.findUnique({
      where: { slug: data.slug }
    });

    if (duplicate) {
      throw new ValidationError('Post with this slug already exists');
    }
  }

  // Check if category exists (if updating)
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId }
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }
  }

  try {
    const updateData: Prisma.PostUpdateInput = {
      ...(data.title && { title: data.title }),
      ...(data.slug && { slug: data.slug }),
      ...(data.content && { content: data.content }),
      ...(data.excerpt !== undefined && { excerpt: data.excerpt || null }),
      ...(data.categoryId && {
        category: {
          connect: { id: data.categoryId }
        }
      }),
      ...(data.status && { status: data.status }),
      ...(data.status === 'PUBLISHED' && !existing.publishedAt && {
        publishedAt: new Date()
      })
    };

    const updated = await prisma.post.update({
      where: { id },
      data: updateData
    });

    logger.info('Post updated', {
      postId: id,
      changes: data
    });

    return updated;
  } catch (error: any) {
    logger.error('Failed to update post', {
      error: error.message,
      postId: id
    });
    throw error;
  }
};

/**
 * Delete post
 */
export const deletePost = async (id: string): Promise<void> => {
  const existing = await getById(id);
  if (!existing) {
    throw new NotFoundError('Post not found');
  }

  try {
    await prisma.post.delete({
      where: { id }
    });

    logger.info('Post deleted', {
      postId: id
    });
  } catch (error: any) {
    logger.error('Failed to delete post', {
      error: error.message,
      postId: id
    });
    throw error;
  }
};

// Alias for consistency
export { deletePost as delete };

