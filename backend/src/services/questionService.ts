import { prisma } from '../config/database';
import { Question, QuestionType, Prisma, Role } from '@prisma/client';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';
import { hasRole } from './rbacService';
import * as questionPaperService from './questionPaperService';

export interface CreateQuestionDto {
  questionPaperId: string;
  questionNumber?: number;
  questionText: string;
  questionType: QuestionType;
  marks: number;
  correctAnswer?: string;
  answerKeywords?: string[];
  modelAnswer?: string;
  options?: any; // JSON for MCQ options
}

export interface UpdateQuestionDto {
  questionNumber?: number;
  questionText?: string;
  questionType?: QuestionType;
  marks?: number;
  correctAnswer?: string;
  answerKeywords?: string[];
  modelAnswer?: string;
  options?: any;
}

/**
 * Get the next question number for a paper
 */
const getNextQuestionNumber = async (questionPaperId: string): Promise<number> => {
  const lastQuestion = await prisma.question.findFirst({
    where: { questionPaperId },
    orderBy: { questionNumber: 'desc' }
  });

  return lastQuestion ? lastQuestion.questionNumber + 1 : 1;
};

/**
 * Create a new question
 */
export const create = async (
  data: CreateQuestionDto,
  userId: string
): Promise<Question> => {
  // Validation
  if (!data.questionText || !data.questionType || !data.marks) {
    throw new ValidationError('questionText, questionType, and marks are required');
  }

  // Check if question paper exists
  const paper = await questionPaperService.getById(data.questionPaperId);
  if (!paper) {
    throw new NotFoundError('Question paper not found');
  }

  // Check authorization: only educator who owns the paper can add questions
  const isEducator = paper.educatorId === userId;
  const isAdmin = await hasRole(userId, Role.ADMIN) || await hasRole(userId, Role.SUPER_ADMIN);

  if (!isEducator && !isAdmin) {
    throw new ForbiddenError('You can only add questions to your own question papers');
  }

  // Get question number (auto-increment if not provided)
  const questionNumber = data.questionNumber || await getNextQuestionNumber(data.questionPaperId);

  // Check if question number already exists
  const existing = await prisma.question.findUnique({
    where: {
      questionPaperId_questionNumber: {
        questionPaperId: data.questionPaperId,
        questionNumber
      }
    }
  });

  if (existing) {
    throw new ValidationError(`Question number ${questionNumber} already exists in this paper`);
  }

  try {
    const question = await prisma.question.create({
      data: {
        questionPaperId: data.questionPaperId,
        questionNumber,
        questionText: data.questionText,
        questionType: data.questionType,
        marks: data.marks,
        correctAnswer: data.correctAnswer || null,
        answerKeywords: data.answerKeywords || [],
        modelAnswer: data.modelAnswer || null,
        options: data.options ? (data.options as Prisma.InputJsonValue) : Prisma.JsonNull
      }
    });

    logger.info('Question created', {
      questionId: question.id,
      questionPaperId: data.questionPaperId,
      questionNumber,
      userId
    });

    return question;
  } catch (error: any) {
    logger.error('Failed to create question', {
      error: error.message,
      questionPaperId: data.questionPaperId,
      userId
    });
    throw error;
  }
};

/**
 * Get all questions for a question paper
 */
export const getAll = async (questionPaperId: string): Promise<Question[]> => {
  return await prisma.question.findMany({
    where: { questionPaperId },
    orderBy: {
      questionNumber: 'asc'
    }
  });
};

/**
 * Get question by ID
 */
export const getById = async (id: string): Promise<Question | null> => {
  return await prisma.question.findUnique({
    where: { id },
    include: {
      questionPaper: {
        select: {
          id: true,
          title: true,
          educatorId: true
        }
      }
    }
  });
};

/**
 * Update question
 */
export const update = async (
  id: string,
  data: UpdateQuestionDto,
  userId: string
): Promise<Question> => {
  // Check if question exists
  const existing = await getById(id);
  if (!existing) {
    throw new NotFoundError('Question not found');
  }

  // Get the paper to check authorization
  const paper = await questionPaperService.getById(existing.questionPaperId);
  if (!paper) {
    throw new NotFoundError('Question paper not found');
  }

  // Check authorization: only educator who owns the paper can update questions
  const isEducator = paper.educatorId === userId;
  const isAdmin = await hasRole(userId, Role.ADMIN) || await hasRole(userId, Role.SUPER_ADMIN);

  if (!isEducator && !isAdmin) {
    throw new ForbiddenError('You can only update questions in your own question papers');
  }

  // Check if question number is being changed and if it conflicts
  if (data.questionNumber && data.questionNumber !== existing.questionNumber) {
    const conflict = await prisma.question.findUnique({
      where: {
        questionPaperId_questionNumber: {
          questionPaperId: existing.questionPaperId,
          questionNumber: data.questionNumber
        }
      }
    });

    if (conflict) {
      throw new ValidationError(`Question number ${data.questionNumber} already exists in this paper`);
    }
  }

  try {
    const updateData: Prisma.QuestionUpdateInput = {
      ...(data.questionNumber !== undefined && { questionNumber: data.questionNumber }),
      ...(data.questionText && { questionText: data.questionText }),
      ...(data.questionType && { questionType: data.questionType }),
      ...(data.marks !== undefined && { marks: data.marks }),
      ...(data.correctAnswer !== undefined && { correctAnswer: data.correctAnswer || null }),
      ...(data.answerKeywords !== undefined && { answerKeywords: data.answerKeywords }),
      ...(data.modelAnswer !== undefined && { modelAnswer: data.modelAnswer || null }),
      ...(data.options !== undefined && {
        options: data.options ? (data.options as Prisma.InputJsonValue) : Prisma.JsonNull
      })
    };

    const updated = await prisma.question.update({
      where: { id },
      data: updateData
    });

    logger.info('Question updated', {
      questionId: id,
      changes: data,
      userId
    });

    return updated;
  } catch (error: any) {
    logger.error('Failed to update question', {
      error: error.message,
      questionId: id
    });
    throw error;
  }
};

/**
 * Delete question
 */
export const deleteQuestion = async (id: string, userId: string): Promise<void> => {
  const existing = await getById(id);
  if (!existing) {
    throw new NotFoundError('Question not found');
  }

  // Get the paper to check authorization
  const paper = await questionPaperService.getById(existing.questionPaperId);
  if (!paper) {
    throw new NotFoundError('Question paper not found');
  }

  // Check authorization: only educator who owns the paper can delete questions
  const isEducator = paper.educatorId === userId;
  const isAdmin = await hasRole(userId, Role.ADMIN) || await hasRole(userId, Role.SUPER_ADMIN);

  if (!isEducator && !isAdmin) {
    throw new ForbiddenError('You can only delete questions from your own question papers');
  }

  try {
    await prisma.question.delete({
      where: { id }
    });

    logger.info('Question deleted', {
      questionId: id,
      userId
    });
  } catch (error: any) {
    logger.error('Failed to delete question', {
      error: error.message,
      questionId: id
    });
    throw error;
  }
};

// Alias for consistency
export { deleteQuestion as delete };

