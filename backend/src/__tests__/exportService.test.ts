import { prisma } from '../config/database';
import * as exportService from '../services/exportService';
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

describe('ExportService', () => {
  describe('exportResultToCSV', () => {
    it('should export result as CSV for student who owns the paper', async () => {
      const csv = await exportService.exportResultToCSV(testAnswerPaper.id, testStudent.id);

      expect(csv).toBeDefined();
      expect(csv).toContain('Question');
      expect(csv).toContain('Marks');
      expect(csv).toContain('Marks Obtained');
      expect(csv).toContain('What is 2+2?');
    });

    it('should export result as CSV for educator', async () => {
      const csv = await exportService.exportResultToCSV(testAnswerPaper.id, testEducator.id);

      expect(csv).toBeDefined();
      expect(csv).toContain('Question');
    });

    it('should throw error if answer paper does not exist', async () => {
      await expect(
        exportService.exportResultToCSV('non-existent-id', testStudent.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if student tries to export another student\'s result', async () => {
      const otherStudent = await createTestUser({
        email: 'other@example.com',
        password: 'Password123!',
        name: 'Other Student',
        role: 'STUDENT'
      });

      await expect(
        exportService.exportResultToCSV(testAnswerPaper.id, otherStudent.id)
      ).rejects.toThrow(ForbiddenError);

      await prisma.user.deleteMany({ where: { id: otherStudent.id } });
    });
  });

  describe('exportQuestionPaperResultsToCSV', () => {
    it('should export all results for a question paper as CSV (educator only)', async () => {
      const csv = await exportService.exportQuestionPaperResultsToCSV(testPaper.id, testEducator.id);

      expect(csv).toBeDefined();
      expect(csv).toContain('Student');
      expect(csv).toContain('Total Marks');
      expect(csv).toContain('Percentage');
      expect(csv).toContain('Grade');
    });

    it('should throw error if user is not the educator', async () => {
      await expect(
        exportService.exportQuestionPaperResultsToCSV(testPaper.id, testStudent.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});

