import { prisma } from '../config/database';
import { AnswerPaper, Role, AnswerPaperStatus } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';
import { hasRole } from './rbacService';
import * as answerPaperService from './answerPaperService';
import * as questionPaperService from './questionPaperService';

export interface ResultDetails {
  answerPaper: AnswerPaper;
  totalMarksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  questionBreakdown: Array<{
    questionId: string;
    questionNumber: number;
    questionText: string;
    marks: number;
    marksObtained: number;
    feedback?: string;
    isCorrect?: boolean;
    similarityScore?: number;
  }>;
}

export interface PerformanceSummary {
  totalPapers: number;
  averagePercentage: number;
  averageGrade: string;
  totalMarksObtained: number;
  totalMarks: number;
  gradeDistribution: Record<string, number>;
}

export interface GradeDistribution {
  total: number;
  grades: Record<string, number>;
  averagePercentage: number;
}

/**
 * Get detailed result for an answer paper
 */
export const getResult = async (
  answerPaperId: string,
  userId: string
): Promise<ResultDetails> => {
  const answerPaper = await answerPaperService.getById(answerPaperId);
  if (!answerPaper) {
    throw new NotFoundError('Answer paper not found');
  }

  // Get question paper to check ownership
  const questionPaper = await questionPaperService.getById(answerPaper.questionPaperId);
  if (!questionPaper) {
    throw new NotFoundError('Question paper not found');
  }

  // Authorization: students can only see their own results, educators can see any
  const isStudent = answerPaper.studentId === userId;
  const isEducator = await hasRole(userId, Role.EDUCATOR) || await hasRole(userId, Role.ADMIN) || await hasRole(userId, Role.SUPER_ADMIN);
  const isPaperOwner = questionPaper.educatorId === userId;

  if (!isStudent && !isEducator && !isPaperOwner) {
    throw new ForbiddenError('You can only view your own results');
  }

  // Get question answers
  const questionAnswers = await prisma.questionAnswer.findMany({
    where: { answerPaperId },
    include: {
      question: true
    },
    orderBy: {
      question: {
        questionNumber: 'asc'
      }
    }
  });

  // Build question breakdown
  const questionBreakdown = questionAnswers.map(qa => ({
    questionId: qa.questionId,
    questionNumber: qa.question.questionNumber,
    questionText: qa.question.questionText,
    marks: qa.question.marks,
    marksObtained: Number(qa.marksObtained || 0),
    feedback: qa.feedback || undefined,
    isCorrect: qa.isCorrect || undefined,
    similarityScore: qa.similarityScore ? Number(qa.similarityScore) : undefined
  }));

  const totalMarksObtained = Number(answerPaper.totalMarksObtained || 0);
  const totalMarks = questionPaper.totalMarks;
  const percentage = Number(answerPaper.percentage || 0);
  const grade = answerPaper.grade || 'N/A';

  logger.info('Result retrieved', {
    answerPaperId,
    userId,
    percentage,
    grade
  });

  return {
    answerPaper,
    totalMarksObtained,
    totalMarks,
    percentage,
    grade,
    questionBreakdown
  };
};

/**
 * Get all results for a student
 */
export const getStudentResults = async (studentId: string): Promise<AnswerPaper[]> => {
  return await prisma.answerPaper.findMany({
    where: {
      studentId,
      status: AnswerPaperStatus.GRADED
    },
    include: {
      questionPaper: {
        select: {
          id: true,
          title: true,
          totalMarks: true
        }
      }
    },
    orderBy: {
      gradedAt: 'desc'
    }
  });
};

/**
 * Get all results for a question paper (educator only)
 */
export const getQuestionPaperResults = async (
  questionPaperId: string,
  userId: string
): Promise<AnswerPaper[]> => {
  // Check if question paper exists and user is the educator
  const paper = await questionPaperService.getById(questionPaperId);
  if (!paper) {
    throw new NotFoundError('Question paper not found');
  }

  const isEducator = paper.educatorId === userId;
  const isAdmin = await hasRole(userId, Role.ADMIN) || await hasRole(userId, Role.SUPER_ADMIN);

  if (!isEducator && !isAdmin) {
    throw new ForbiddenError('Only the educator who owns the paper can view results');
  }

  return await prisma.answerPaper.findMany({
    where: {
      questionPaperId,
      status: AnswerPaperStatus.GRADED
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      gradedAt: 'desc'
    }
  });
};

/**
 * Get performance summary for a student
 */
export const getPerformanceSummary = async (studentId: string): Promise<PerformanceSummary> => {
  const papers = await prisma.answerPaper.findMany({
    where: {
      studentId,
      status: AnswerPaperStatus.GRADED
    },
    include: {
      questionPaper: {
        select: {
          totalMarks: true
        }
      }
    }
  });

  const totalPapers = papers.length;
  let totalMarksObtained = 0;
  let totalMarks = 0;
  const gradeDistribution: Record<string, number> = {};

  papers.forEach(paper => {
    totalMarksObtained += Number(paper.totalMarksObtained || 0);
    totalMarks += paper.questionPaper.totalMarks;
    const grade = paper.grade || 'N/A';
    gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
  });

  const averagePercentage = totalPapers > 0 && totalMarks > 0
    ? (totalMarksObtained / totalMarks) * 100
    : 0;

  // Calculate average grade
  const averageGrade = calculateAverageGrade(averagePercentage);

  logger.info('Performance summary retrieved', {
    studentId,
    totalPapers,
    averagePercentage
  });

  return {
    totalPapers,
    averagePercentage,
    averageGrade,
    totalMarksObtained,
    totalMarks,
    gradeDistribution
  };
};

/**
 * Get grade distribution for a question paper (educator only)
 */
export const getGradeDistribution = async (
  questionPaperId: string,
  userId: string
): Promise<GradeDistribution> => {
  // Check if question paper exists and user is the educator
  const paper = await questionPaperService.getById(questionPaperId);
  if (!paper) {
    throw new NotFoundError('Question paper not found');
  }

  const isEducator = paper.educatorId === userId;
  const isAdmin = await hasRole(userId, Role.ADMIN) || await hasRole(userId, Role.SUPER_ADMIN);

  if (!isEducator && !isAdmin) {
    throw new ForbiddenError('Only the educator who owns the paper can view grade distribution');
  }

  const papers = await prisma.answerPaper.findMany({
    where: {
      questionPaperId,
      status: AnswerPaperStatus.GRADED
    }
  });

  const total = papers.length;
  const grades: Record<string, number> = {};
  let totalPercentage = 0;

  papers.forEach(paper => {
    const grade = paper.grade || 'N/A';
    grades[grade] = (grades[grade] || 0) + 1;
    totalPercentage += Number(paper.percentage || 0);
  });

  const averagePercentage = total > 0 ? totalPercentage / total : 0;

  logger.info('Grade distribution retrieved', {
    questionPaperId,
    total,
    averagePercentage
  });

  return {
    total,
    grades,
    averagePercentage
  };
};

/**
 * Calculate average grade from percentage
 */
const calculateAverageGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 30) return 'D';
  return 'F';
};

