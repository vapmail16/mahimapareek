import { prisma } from '../config/database';
import { QuestionPaper, QuestionPaperStatus, Prisma, Role } from '@prisma/client';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';
import { hasRole } from './rbacService';

export interface CreateQuestionPaperDto {
  title: string;
  description?: string;
  educatorId: string;
  subject?: string;
  gradeLevel?: string;
  totalMarks: number;
  durationMinutes?: number;
  instructions?: string;
  status?: QuestionPaperStatus;
}

export interface UpdateQuestionPaperDto {
  title?: string;
  description?: string;
  subject?: string;
  gradeLevel?: string;
  totalMarks?: number;
  durationMinutes?: number;
  instructions?: string;
  status?: QuestionPaperStatus;
}

export interface QuestionPaperFilters {
  educatorId?: string;
  status?: QuestionPaperStatus;
}

/**
 * Create a new question paper
 */
export const create = async (data: CreateQuestionPaperDto): Promise<QuestionPaper> => {
  // Validation
  if (!data.title || !data.totalMarks) {
    throw new ValidationError('Title and totalMarks are required');
  }

  // Check if educator exists
  const educator = await prisma.user.findUnique({
    where: { id: data.educatorId }
  });

  if (!educator) {
    throw new NotFoundError('Educator not found');
  }

  // Check if user is an educator
  if (educator.role !== Role.EDUCATOR) {
    throw new ForbiddenError('Only educators can create question papers');
  }

  try {
    const paper = await prisma.questionPaper.create({
      data: {
        title: data.title,
        description: data.description || null,
        educatorId: data.educatorId,
        subject: data.subject || null,
        gradeLevel: data.gradeLevel || null,
        totalMarks: data.totalMarks,
        durationMinutes: data.durationMinutes || null,
        instructions: data.instructions || null,
        status: data.status || QuestionPaperStatus.DRAFT
      }
    });

    logger.info('Question paper created', {
      paperId: paper.id,
      title: paper.title,
      educatorId: data.educatorId
    });

    return paper;
  } catch (error: any) {
    logger.error('Failed to create question paper', {
      error: error.message,
      title: data.title,
      educatorId: data.educatorId
    });
    throw error;
  }
};

/**
 * Get all question papers with optional filters
 */
export const getAll = async (filters?: QuestionPaperFilters): Promise<QuestionPaper[]> => {
  const where: Prisma.QuestionPaperWhereInput = {};

  if (filters?.educatorId) {
    where.educatorId = filters.educatorId;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  return await prisma.questionPaper.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      educator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          questions: true
        }
      }
    }
  });
};

/**
 * Get question paper by ID
 */
export const getById = async (id: string): Promise<QuestionPaper | null> => {
  return await prisma.questionPaper.findUnique({
    where: { id },
    include: {
      educator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      questions: {
        orderBy: {
          questionNumber: 'asc'
        }
      }
    }
  });
};

/**
 * Update question paper
 */
export const update = async (
  id: string,
  data: UpdateQuestionPaperDto,
  userId: string
): Promise<QuestionPaper> => {
  // Check if paper exists
  const existing = await getById(id);
  if (!existing) {
    throw new NotFoundError('Question paper not found');
  }

  // Check authorization: educator can update their own papers, admin can update any
  const isEducator = existing.educatorId === userId;
  const isAdmin = await hasRole(userId, Role.ADMIN) || await hasRole(userId, Role.SUPER_ADMIN);

  if (!isEducator && !isAdmin) {
    throw new ForbiddenError('You can only update your own question papers');
  }

  try {
    const updateData: Prisma.QuestionPaperUpdateInput = {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.subject !== undefined && { subject: data.subject || null }),
      ...(data.gradeLevel !== undefined && { gradeLevel: data.gradeLevel || null }),
      ...(data.totalMarks !== undefined && { totalMarks: data.totalMarks }),
      ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes || null }),
      ...(data.instructions !== undefined && { instructions: data.instructions || null }),
      ...(data.status && { status: data.status })
    };

    const updated = await prisma.questionPaper.update({
      where: { id },
      data: updateData
    });

    logger.info('Question paper updated', {
      paperId: id,
      changes: data,
      userId
    });

    return updated;
  } catch (error: any) {
    logger.error('Failed to update question paper', {
      error: error.message,
      paperId: id
    });
    throw error;
  }
};

/**
 * Delete question paper
 */
export const deletePaper = async (id: string, userId: string): Promise<void> => {
  const existing = await getById(id);
  if (!existing) {
    throw new NotFoundError('Question paper not found');
  }

  // Check authorization: educator can delete their own papers, admin can delete any
  const isEducator = existing.educatorId === userId;
  const isAdmin = await hasRole(userId, Role.ADMIN) || await hasRole(userId, Role.SUPER_ADMIN);

  if (!isEducator && !isAdmin) {
    throw new ForbiddenError('You can only delete your own question papers');
  }

  try {
    // Questions will be cascade deleted
    await prisma.questionPaper.delete({
      where: { id }
    });

    logger.info('Question paper deleted', {
      paperId: id,
      userId
    });
  } catch (error: any) {
    logger.error('Failed to delete question paper', {
      error: error.message,
      paperId: id
    });
    throw error;
  }
};

// Alias for consistency
export { deletePaper as delete };

