import { prisma } from '../config/database';
import { QuestionAnswer, AnswerPaper, QuestionType, AnswerPaperStatus } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';
import * as questionService from './questionService';
import * as answerPaperService from './answerPaperService';
import { config } from '../config';
import OpenAI from 'openai';

// Initialize OpenAI client (only if API key is provided)
let openaiClient: OpenAI | null = null;
if (config.ai.openaiApiKey) {
  openaiClient = new OpenAI({
    apiKey: config.ai.openaiApiKey,
  });
}

export interface GradingResult {
  questionAnswerId: string;
  isCorrect?: boolean;
  marksObtained: number;
  similarityScore?: number;
  feedback?: string;
}

/**
 * Grade MCQ question
 */
export const gradeMCQ = async (
  questionId: string,
  studentAnswer: string,
  answerPaperId: string
): Promise<QuestionAnswer> => {
  const question = await questionService.getById(questionId);
  if (!question) {
    throw new NotFoundError('Question not found');
  }

  if (question.questionType !== QuestionType.MCQ) {
    throw new ValidationError('Question is not an MCQ');
  }

  const isCorrect = question.correctAnswer?.toLowerCase().trim() === studentAnswer.toLowerCase().trim();
  const marksObtained = isCorrect ? question.marks : 0;

  // Find or create question answer
  let questionAnswer = await prisma.questionAnswer.findUnique({
    where: {
      answerPaperId_questionId: {
        answerPaperId,
        questionId
      }
    }
  });

  if (questionAnswer) {
    questionAnswer = await prisma.questionAnswer.update({
      where: { id: questionAnswer.id },
      data: {
        answerText: studentAnswer,
        isCorrect,
        marksObtained,
        gradedAt: new Date()
      }
    });
  } else {
    questionAnswer = await prisma.questionAnswer.create({
      data: {
        answerPaperId,
        questionId,
        answerText: studentAnswer,
        isCorrect,
        marksObtained,
        gradedAt: new Date()
      }
    });
  }

  logger.info('MCQ graded', {
    questionId,
    answerPaperId,
    isCorrect,
    marksObtained
  });

  return questionAnswer;
};

/**
 * Grade short answer question (keyword matching)
 */
export const gradeShortAnswer = async (
  questionId: string,
  studentAnswer: string,
  answerPaperId: string
): Promise<QuestionAnswer> => {
  const question = await questionService.getById(questionId);
  if (!question) {
    throw new NotFoundError('Question not found');
  }

  if (question.questionType !== QuestionType.SHORT_ANSWER) {
    throw new ValidationError('Question is not a short answer');
  }

  // Check if answer contains keywords
  const keywords = question.answerKeywords || [];
  const answerLower = studentAnswer.toLowerCase();
  const hasKeywords = keywords.some(keyword => 
    answerLower.includes(keyword.toLowerCase())
  );

  // Also check exact match with correct answer
  const exactMatch = question.correctAnswer?.toLowerCase().trim() === studentAnswer.toLowerCase().trim();
  const isCorrect = exactMatch || hasKeywords;
  const marksObtained = isCorrect ? question.marks : 0;

  let questionAnswer = await prisma.questionAnswer.findUnique({
    where: {
      answerPaperId_questionId: {
        answerPaperId,
        questionId
      }
    }
  });

  if (questionAnswer) {
    questionAnswer = await prisma.questionAnswer.update({
      where: { id: questionAnswer.id },
      data: {
        answerText: studentAnswer,
        isCorrect,
        marksObtained,
        gradedAt: new Date()
      }
    });
  } else {
    questionAnswer = await prisma.questionAnswer.create({
      data: {
        answerPaperId,
        questionId,
        answerText: studentAnswer,
        isCorrect,
        marksObtained,
        gradedAt: new Date()
      }
    });
  }

  logger.info('Short answer graded', {
    questionId,
    answerPaperId,
    isCorrect,
    marksObtained
  });

  return questionAnswer;
};

/**
 * Grade long answer question (AI-powered semantic similarity)
 */
export const gradeLongAnswer = async (
  questionId: string,
  studentAnswer: string,
  answerPaperId: string
): Promise<QuestionAnswer> => {
  const question = await questionService.getById(questionId);
  if (!question) {
    throw new NotFoundError('Question not found');
  }

  if (question.questionType !== QuestionType.LONG_ANSWER && question.questionType !== QuestionType.ESSAY) {
    throw new ValidationError('Question is not a long answer or essay');
  }

  let similarityScore = 0;
  let marksObtained = 0;
  let feedback = '';
  let prompt = '';
  let responseText = '';
  let aiCompletion: any = null;

  // Use AI if available, otherwise use simple keyword matching
  if (openaiClient && question.modelAnswer) {
    try {
      prompt = `You are an expert educator grading a student's answer. Compare the student's answer with the model answer and provide:
1. A similarity score from 0-100 (how well the student's answer matches the model answer in terms of content, key points, and understanding)
2. Detailed feedback on what the student did well and what could be improved
3. A grade recommendation based on the similarity score

Model Answer: ${question.modelAnswer}
Student Answer: ${studentAnswer}
Maximum Marks: ${question.marks}

Respond in JSON format:
{
  "similarityScore": <number 0-100>,
  "feedback": "<detailed feedback>",
  "gradeRecommendation": "<A+, A, B+, B, C+, C, D, or F>"
}`;

      aiCompletion = await openaiClient.chat.completions.create({
        model: config.ai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator providing detailed, constructive feedback on student answers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.ai.temperature,
        max_tokens: config.ai.maxTokens,
      });

      responseText = aiCompletion.choices[0]?.message?.content || '';
      
      // Parse JSON response
      try {
        const parsed = JSON.parse(responseText);
        similarityScore = Math.min(100, Math.max(0, parsed.similarityScore || 0));
        feedback = parsed.feedback || '';
        marksObtained = Math.round((similarityScore / 100) * question.marks);
      } catch (parseError) {
        // Fallback: extract similarity from text if JSON parsing fails
        logger.warn('Failed to parse AI response as JSON', {
          questionId,
          responseText: responseText.substring(0, 200)
        });
        // Use keyword matching as fallback
        similarityScore = calculateKeywordSimilarity(studentAnswer, question.modelAnswer);
        marksObtained = Math.round((similarityScore / 100) * question.marks);
        feedback = 'AI grading unavailable. Using keyword-based assessment.';
      }

      // Store AI grading result will be saved after questionAnswer is created
    } catch (error: any) {
      logger.error('AI grading failed, using fallback', {
        error: error.message,
        questionId
      });
      // Fallback to keyword matching
      similarityScore = calculateKeywordSimilarity(studentAnswer, question.modelAnswer || '');
      marksObtained = Math.round((similarityScore / 100) * question.marks);
      feedback = 'AI grading unavailable. Using keyword-based assessment.';
    }
  } else {
    // No AI available, use keyword matching
    similarityScore = calculateKeywordSimilarity(studentAnswer, question.modelAnswer || '');
    marksObtained = Math.round((similarityScore / 100) * question.marks);
    feedback = 'Using keyword-based assessment.';
  }

  let questionAnswer = await prisma.questionAnswer.findUnique({
    where: {
      answerPaperId_questionId: {
        answerPaperId,
        questionId
      }
    }
  });

  if (questionAnswer) {
    questionAnswer = await prisma.questionAnswer.update({
      where: { id: questionAnswer.id },
      data: {
        answerText: studentAnswer,
        similarityScore,
        marksObtained,
        feedback,
        gradedAt: new Date()
      }
    });
  } else {
    questionAnswer = await prisma.questionAnswer.create({
      data: {
        answerPaperId,
        questionId,
        answerText: studentAnswer,
        similarityScore,
        marksObtained,
        feedback,
        gradedAt: new Date()
      }
    });
  }

  // Log with converted values to avoid Decimal JSON parsing issues
  try {
    logger.info('Long answer graded', {
      questionId,
      answerPaperId,
      similarityScore: Number(similarityScore),
      marksObtained: Number(marksObtained)
    });
  } catch (error) {
    // Silently skip logging if there's an issue
  }

  return questionAnswer;
};

/**
 * Calculate keyword similarity (fallback when AI is not available)
 */
const calculateKeywordSimilarity = (answer: string, modelAnswer: string): number => {
  if (!modelAnswer) return 0;

  const answerWords = answer.toLowerCase().split(/\s+/);
  const modelWords = modelAnswer.toLowerCase().split(/\s+/);
  
  const uniqueModelWords = new Set(modelWords);
  const matchingWords = answerWords.filter(word => uniqueModelWords.has(word));
  
  // Calculate similarity as percentage of matching words
  const similarity = (matchingWords.length / uniqueModelWords.size) * 100;
  return Math.min(100, Math.max(0, similarity));
};

/**
 * Grade entire answer paper
 */
export const gradeAnswerPaper = async (
  answerPaperId: string,
  gradedBy: string
): Promise<AnswerPaper> => {
  const answerPaper = await answerPaperService.getById(answerPaperId);
  if (!answerPaper) {
    throw new NotFoundError('Answer paper not found');
  }

  // Get question paper with questions
  const questionPaper = await prisma.questionPaper.findUnique({
    where: { id: answerPaper.questionPaperId },
    include: {
      questions: {
        orderBy: {
          questionNumber: 'asc'
        }
      }
    }
  });

  if (!questionPaper) {
    throw new NotFoundError('Question paper not found');
  }

  // Get all questions for the paper
  const questions = questionPaper.questions;

  // Grade each question answer
  let totalMarksObtained = 0;
  const totalMarks = questionPaper.totalMarks;

  for (const question of questions) {
    const questionAnswer = await prisma.questionAnswer.findUnique({
      where: {
        answerPaperId_questionId: {
          answerPaperId,
          questionId: question.id
        }
      }
    });

    if (questionAnswer && questionAnswer.marksObtained !== null) {
      totalMarksObtained += Number(questionAnswer.marksObtained);
    }
  }

  // Calculate percentage and grade
  const percentage = totalMarks > 0 ? (totalMarksObtained / totalMarks) * 100 : 0;
  const grade = calculateGrade(percentage);

  // Update answer paper
  const updated = await answerPaperService.updateStatus(
    answerPaperId,
    AnswerPaperStatus.GRADED,
    gradedBy,
    {
      totalMarksObtained,
      percentage,
      grade,
      feedback: `Graded automatically. Total marks: ${totalMarksObtained}/${totalMarks}`
    }
  );

  logger.info('Answer paper graded', {
    answerPaperId,
    totalMarksObtained,
    totalMarks,
    percentage,
    grade
  });

  return updated;
};

/**
 * Calculate grade based on percentage
 */
export const calculateGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 30) return 'D';
  return 'F';
};

