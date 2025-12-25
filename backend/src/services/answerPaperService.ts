import { prisma } from '../config/database';
import { AnswerPaper, AnswerPaperStatus, AnswerFile, Prisma } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';
import * as questionPaperService from './questionPaperService';

export interface CreateAnswerPaperDto {
  questionPaperId: string;
  studentId: string;
}

export interface UpdateAnswerPaperStatusDto {
  status: AnswerPaperStatus;
  gradedBy?: string;
  totalMarksObtained?: number;
  percentage?: number;
  grade?: string;
  feedback?: string;
}

export interface AnswerPaperFilters {
  studentId?: string;
  questionPaperId?: string;
  status?: AnswerPaperStatus;
}

export interface AddFileDto {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
}

/**
 * Create a new answer paper submission
 */
export const create = async (data: CreateAnswerPaperDto): Promise<AnswerPaper> => {
  // Check if question paper exists
  const paper = await questionPaperService.getById(data.questionPaperId);
  if (!paper) {
    throw new NotFoundError('Question paper not found');
  }

  // Check if question paper is published
  if (paper.status !== 'PUBLISHED') {
    throw new ValidationError('Cannot submit answers to a draft or archived question paper');
  }

  // Check if student exists
  const student = await prisma.user.findUnique({
    where: { id: data.studentId }
  });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  // Check for duplicate submission
  const existing = await prisma.answerPaper.findFirst({
    where: {
      questionPaperId: data.questionPaperId,
      studentId: data.studentId
    }
  });

  if (existing) {
    throw new ValidationError('You have already submitted an answer paper for this question paper');
  }

  try {
    const answerPaper = await prisma.answerPaper.create({
      data: {
        questionPaperId: data.questionPaperId,
        studentId: data.studentId,
        status: AnswerPaperStatus.SUBMITTED
      }
    });

    logger.info('Answer paper created', {
      answerPaperId: answerPaper.id,
      questionPaperId: data.questionPaperId,
      studentId: data.studentId
    });

    return answerPaper;
  } catch (error: any) {
    logger.error('Failed to create answer paper', {
      error: error.message,
      questionPaperId: data.questionPaperId,
      studentId: data.studentId
    });
    throw error;
  }
};

/**
 * Get all answer papers with optional filters
 */
export const getAll = async (filters?: AnswerPaperFilters): Promise<AnswerPaper[]> => {
  const where: Prisma.AnswerPaperWhereInput = {};

  if (filters?.studentId) {
    where.studentId = filters.studentId;
  }

  if (filters?.questionPaperId) {
    where.questionPaperId = filters.questionPaperId;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  return await prisma.answerPaper.findMany({
    where,
    orderBy: {
      submittedAt: 'desc'
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      questionPaper: {
        select: {
          id: true,
          title: true,
          totalMarks: true
        }
      },
      _count: {
        select: {
          answerFiles: true,
          questionAnswers: true
        }
      }
    }
  });
};

/**
 * Get answer paper by ID
 */
export const getById = async (id: string): Promise<AnswerPaper | null> => {
  return await prisma.answerPaper.findUnique({
    where: { id },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      questionPaper: {
        include: {
          questions: {
            orderBy: {
              questionNumber: 'asc'
            }
          }
        }
      },
      answerFiles: {
        orderBy: {
          uploadedAt: 'desc'
        }
      },
      questionAnswers: {
        include: {
          question: true
        },
        orderBy: {
          question: {
            questionNumber: 'asc'
          }
        }
      }
    }
  });
};

/**
 * Get answer papers by student ID
 */
export const getByStudent = async (studentId: string): Promise<AnswerPaper[]> => {
  return await prisma.answerPaper.findMany({
    where: { studentId },
    orderBy: {
      submittedAt: 'desc'
    },
    include: {
      questionPaper: {
        select: {
          id: true,
          title: true,
          totalMarks: true
        }
      }
    }
  });
};

/**
 * Update answer paper status and grading info
 */
export const updateStatus = async (
  id: string,
  status: AnswerPaperStatus,
  gradedBy?: string,
  gradingData?: {
    totalMarksObtained?: number;
    percentage?: number;
    grade?: string;
    feedback?: string;
  }
): Promise<AnswerPaper> => {
  const existing = await getById(id);
  if (!existing) {
    throw new NotFoundError('Answer paper not found');
  }

  try {
    const updateData: Prisma.AnswerPaperUpdateInput = {
      status,
      ...(status === AnswerPaperStatus.GRADED && {
        gradedAt: new Date(),
        ...(gradedBy && { gradedBy }),
        ...(gradingData?.totalMarksObtained !== undefined && {
          totalMarksObtained: gradingData.totalMarksObtained
        }),
        ...(gradingData?.percentage !== undefined && {
          percentage: gradingData.percentage
        }),
        ...(gradingData?.grade && { grade: gradingData.grade }),
        ...(gradingData?.feedback && { feedback: gradingData.feedback })
      })
    };

    const updated = await prisma.answerPaper.update({
      where: { id },
      data: updateData
    });

    logger.info('Answer paper status updated', {
      answerPaperId: id,
      status,
      gradedBy
    });

    return updated;
  } catch (error: any) {
    logger.error('Failed to update answer paper status', {
      error: error.message,
      answerPaperId: id
    });
    throw error;
  }
};

/**
 * Add a file to an answer paper
 */
export const addFile = async (
  answerPaperId: string,
  fileData: AddFileDto
): Promise<AnswerFile> => {
  const answerPaper = await getById(answerPaperId);
  if (!answerPaper) {
    throw new NotFoundError('Answer paper not found');
  }

  try {
    const file = await prisma.answerFile.create({
      data: {
        answerPaperId,
        fileName: fileData.fileName,
        filePath: fileData.filePath,
        fileType: fileData.fileType,
        fileSize: fileData.fileSize
      }
    });

    logger.info('File added to answer paper', {
      fileId: file.id,
      answerPaperId,
      fileName: fileData.fileName
    });

    return file;
  } catch (error: any) {
    logger.error('Failed to add file to answer paper', {
      error: error.message,
      answerPaperId
    });
    throw error;
  }
};

/**
 * Get all files for an answer paper
 */
export const getFiles = async (answerPaperId: string): Promise<AnswerFile[]> => {
  return await prisma.answerFile.findMany({
    where: { answerPaperId },
    orderBy: {
      uploadedAt: 'desc'
    }
  });
};

/**
 * Delete a file from an answer paper
 */
export const deleteFile = async (fileId: string): Promise<void> => {
  const file = await prisma.answerFile.findUnique({
    where: { id: fileId }
  });

  if (!file) {
    throw new NotFoundError('File not found');
  }

  try {
    await prisma.answerFile.delete({
      where: { id: fileId }
    });

    logger.info('File deleted from answer paper', {
      fileId,
      answerPaperId: file.answerPaperId
    });
  } catch (error: any) {
    logger.error('Failed to delete file', {
      error: error.message,
      fileId
    });
    throw error;
  }
};

