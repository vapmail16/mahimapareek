import { prisma } from '../config/database';
import * as resultsService from '../services/resultsService';
import * as questionPaperService from '../services/questionPaperService';
import * as questionService from '../services/questionService';
import * as answerPaperService from '../services/answerPaperService';
import * as gradingService from '../services/gradingService';
import { createTestUser } from '../tests/setup';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { QuestionType } from '@prisma/client';

// Test fixtures
let testStudent: any;
let testEducator: any;
let testPaper: any;
let testAnswerPaper: any;
let testQuestion1: any;
let testQuestion2: any;

beforeEach(async () => {
  // Clean up
  await prisma.aIGradingResult.deleteMany({});
  await prisma.questionAnswer.deleteMany({});
  await prisma.answerFile.deleteMany({});
  await prisma.answerPaper.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.questionPaper.deleteMany({});
  
  // Create test users
  testStudent = await createTestUser({
    email: 'student@example.com',
    password: 'Password123!',
    name: 'Test Student',
    role: 'STUDENT'
  });

  testEducator = await createTestUser({
    email: 'educator@example.com',
    password: 'Password123!',
    name: 'Test Educator',
    role: 'EDUCATOR'
  });

  // Create test question paper
  testPaper = await questionPaperService.create({
    title: 'Test Paper',
    educatorId: testEducator.id,
    totalMarks: 100,
    status: 'PUBLISHED'
  });

  // Create test questions
  testQuestion1 = await questionService.create({
    questionPaperId: testPaper.id,
    questionNumber: 1,
    questionText: 'What is 2+2?',
    questionType: QuestionType.MCQ,
    marks: 50,
    correctAnswer: '4'
  }, testEducator.id);

  testQuestion2 = await questionService.create({
    questionPaperId: testPaper.id,
    questionNumber: 2,
    questionText: 'What is the capital of France?',
    questionType: QuestionType.SHORT_ANSWER,
    marks: 50,
    correctAnswer: 'Paris',
    answerKeywords: ['Paris']
  }, testEducator.id);

  // Create and grade test answer paper
  testAnswerPaper = await answerPaperService.create({
    questionPaperId: testPaper.id,
    studentId: testStudent.id
  });

  // Grade the answers
  await gradingService.gradeMCQ(testQuestion1.id, '4', testAnswerPaper.id);
  await gradingService.gradeShortAnswer(testQuestion2.id, 'Paris', testAnswerPaper.id);
  await gradingService.gradeAnswerPaper(testAnswerPaper.id, testEducator.id);
});

afterAll(async () => {
  await prisma.aIGradingResult.deleteMany({});
  await prisma.questionAnswer.deleteMany({});
  await prisma.answerFile.deleteMany({});
  await prisma.answerPaper.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.questionPaper.deleteMany({});
  if (testStudent?.id) {
    await prisma.user.deleteMany({ where: { id: testStudent.id } });
  }
  if (testEducator?.id) {
    await prisma.user.deleteMany({ where: { id: testEducator.id } });
  }
  await prisma.$disconnect();
});

describe('ResultsService', () => {
  describe('getResult', () => {
    it('should return result for student who owns the paper', async () => {
      const result = await resultsService.getResult(testAnswerPaper.id, testStudent.id);

      expect(result).toBeDefined();
      expect(result.answerPaper.id).toBe(testAnswerPaper.id);
      expect(result.totalMarksObtained).toBe(100);
      expect(result.percentage).toBe(100);
      expect(result.grade).toBe('A+');
    });

    it('should return result for educator who owns the paper', async () => {
      const result = await resultsService.getResult(testAnswerPaper.id, testEducator.id);

      expect(result).toBeDefined();
      expect(result.answerPaper.id).toBe(testAnswerPaper.id);
    });

    it('should throw error if answer paper does not exist', async () => {
      await expect(
        resultsService.getResult('non-existent-id', testStudent.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if student tries to access another student\'s result', async () => {
      const otherStudent = await createTestUser({
        email: 'other@example.com',
        password: 'Password123!',
        name: 'Other Student',
        role: 'STUDENT'
      });

      await expect(
        resultsService.getResult(testAnswerPaper.id, otherStudent.id)
      ).rejects.toThrow(ForbiddenError);

      await prisma.user.deleteMany({ where: { id: otherStudent.id } });
    });
  });

  describe('getStudentResults', () => {
    it('should return all results for a student', async () => {
      const results = await resultsService.getStudentResults(testStudent.id);

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].studentId).toBe(testStudent.id);
    });

    it('should return empty array if student has no results', async () => {
      const newStudent = await createTestUser({
        email: 'newstudent@example.com',
        password: 'Password123!',
        name: 'New Student',
        role: 'STUDENT'
      });

      const results = await resultsService.getStudentResults(newStudent.id);
      expect(results.length).toBe(0);

      await prisma.user.deleteMany({ where: { id: newStudent.id } });
    });
  });

  describe('getQuestionPaperResults', () => {
    it('should return all results for a question paper (educator only)', async () => {
      const results = await resultsService.getQuestionPaperResults(testPaper.id, testEducator.id);

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].questionPaperId).toBe(testPaper.id);
    });

    it('should throw error if user is not the educator', async () => {
      await expect(
        resultsService.getQuestionPaperResults(testPaper.id, testStudent.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getPerformanceSummary', () => {
    it('should return performance summary for student', async () => {
      const summary = await resultsService.getPerformanceSummary(testStudent.id);

      expect(summary).toBeDefined();
      expect(summary.totalPapers).toBeGreaterThanOrEqual(1);
      expect(summary.averagePercentage).toBeGreaterThanOrEqual(0);
      expect(summary.averagePercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('getGradeDistribution', () => {
    it('should return grade distribution for a question paper', async () => {
      const distribution = await resultsService.getGradeDistribution(testPaper.id, testEducator.id);

      expect(distribution).toBeDefined();
      expect(distribution.total).toBeGreaterThanOrEqual(1);
      expect(distribution.grades).toBeDefined();
    });

    it('should throw error if user is not the educator', async () => {
      await expect(
        resultsService.getGradeDistribution(testPaper.id, testStudent.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});

