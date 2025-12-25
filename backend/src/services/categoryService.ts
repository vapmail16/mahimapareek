import { prisma } from '../config/database';
import { Category } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
}

/**
 * Create a new category
 */
export const create = async (data: CreateCategoryDto): Promise<Category> => {
  // Validation
  if (!data.name || !data.slug) {
    throw new ValidationError('Name and slug are required');
  }

  // Check for duplicates
  const existing = await prisma.category.findFirst({
    where: {
      OR: [
        { name: data.name },
        { slug: data.slug }
      ]
    }
  });

  if (existing) {
    throw new ValidationError(
      existing.name === data.name
        ? 'Category with this name already exists'
        : 'Category with this slug already exists'
    );
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null
      }
    });

    logger.info('Category created', {
      categoryId: category.id,
      name: category.name,
      slug: category.slug
    });

    return category;
  } catch (error: any) {
    logger.error('Failed to create category', {
      error: error.message,
      name: data.name
    });
    throw error;
  }
};

/**
 * Get all categories
 */
export const getAll = async (): Promise<Category[]> => {
  return await prisma.category.findMany({
    orderBy: {
      name: 'asc'
    }
  });
};

/**
 * Get category by slug
 */
export const getBySlug = async (slug: string): Promise<Category | null> => {
  return await prisma.category.findUnique({
    where: { slug }
  });
};

/**
 * Get category by ID
 */
export const getById = async (id: string): Promise<Category | null> => {
  return await prisma.category.findUnique({
    where: { id }
  });
};

/**
 * Update category
 */
export const update = async (
  id: string,
  data: UpdateCategoryDto
): Promise<Category> => {
  // Check if category exists
  const existing = await getById(id);
  if (!existing) {
    throw new NotFoundError('Category not found');
  }

  // Check for duplicate name/slug if updating
  if (data.name || data.slug) {
    const duplicate = await prisma.category.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              data.name ? { name: data.name } : {},
              data.slug ? { slug: data.slug } : {}
            ]
          }
        ]
      }
    });

    if (duplicate) {
      throw new ValidationError(
        duplicate.name === data.name
          ? 'Category with this name already exists'
          : 'Category with this slug already exists'
      );
    }
  }

  try {
    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description })
      }
    });

    logger.info('Category updated', {
      categoryId: id,
      changes: data
    });

    return updated;
  } catch (error: any) {
    logger.error('Failed to update category', {
      error: error.message,
      categoryId: id
    });
    throw error;
  }
};

/**
 * Delete category
 */
export const deleteCategory = async (id: string): Promise<void> => {
  const existing = await getById(id);
  if (!existing) {
    throw new NotFoundError('Category not found');
  }

  try {
    await prisma.category.delete({
      where: { id }
    });

    logger.info('Category deleted', {
      categoryId: id
    });
  } catch (error: any) {
    logger.error('Failed to delete category', {
      error: error.message,
      categoryId: id
    });
    throw error;
  }
};

// Alias for consistency
export { deleteCategory as delete };

