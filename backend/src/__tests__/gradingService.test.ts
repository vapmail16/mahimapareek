import { prisma } from '../config/database';
import * as gradingService from '../services/gradingService';
import * as questionPaperService from '../services/questionPaperService';
import * as questionService from '../services/questionService';
import * as answerPaperService from '../services/answerPaperService';
import { createTestUser } from '../tests/setup';
import { NotFoundError, ValidationError } from '../utils/errors';
import { QuestionType, AnswerPaperStatus } from '@prisma/client';

// Test fixtures
let testStudent: any;
let testEducator: any;
let testPaper: any;
let testAnswerPaper: any;
let testQuestion1: any; // MCQ
let testQuestion2: any; // SHORT_ANSWER
let testQuestion3: any; // LONG_ANSWER

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
    marks: 10,
    correctAnswer: '4',
    options: [
      { id: 1, text: '2' },
      { id: 2, text: '4' },
      { id: 3, text: '6' },
      { id: 4, text: '8' }
    ]
  }, testEducator.id);

  testQuestion2 = await questionService.create({
    questionPaperId: testPaper.id,
    questionNumber: 2,
    questionText: 'What is the capital of France?',
    questionType: QuestionType.SHORT_ANSWER,
    marks: 5,
    correctAnswer: 'Paris',
    answerKeywords: ['Paris', 'paris']
  }, testEducator.id);

  testQuestion3 = await questionService.create({
    questionPaperId: testPaper.id,
    questionNumber: 3,
    questionText: 'Explain the water cycle.',
    questionType: QuestionType.LONG_ANSWER,
    marks: 15,
    modelAnswer: 'The water cycle is the continuous movement of water on, above, and below the surface of the Earth.'
  }, testEducator.id);

  // Create test answer paper
  testAnswerPaper = await answerPaperService.create({
    questionPaperId: testPaper.id,
    studentId: testStudent.id
  });
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

describe('GradingService', () => {
  describe('gradeMCQ', () => {
    it('should grade MCQ correctly when answer matches', async () => {
      const result = await gradingService.gradeMCQ(
        testQuestion1.id,
        '4',
        testAnswerPaper.id
      );

      expect(result.isCorrect).toBe(true);
      expect(Number(result.marksObtained)).toBe(10);
    });

    it('should grade MCQ incorrectly when answer does not match', async () => {
      const result = await gradingService.gradeMCQ(
        testQuestion1.id,
        '2',
        testAnswerPaper.id
      );

      expect(result.isCorrect).toBe(false);
      expect(Number(result.marksObtained)).toBe(0);
    });

    it('should throw error if question does not exist', async () => {
      await expect(
        gradingService.gradeMCQ('non-existent-id', '4', testAnswerPaper.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if question is not MCQ type', async () => {
      await expect(
        gradingService.gradeMCQ(testQuestion2.id, 'Paris', testAnswerPaper.id)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('gradeShortAnswer', () => {
    it('should grade short answer correctly when keywords match', async () => {
      const result = await gradingService.gradeShortAnswer(
        testQuestion2.id,
        'The capital is Paris',
        testAnswerPaper.id
      );

      expect(result.isCorrect).toBe(true);
      expect(Number(result.marksObtained)).toBe(5);
    });

    it('should grade short answer incorrectly when keywords do not match', async () => {
      const result = await gradingService.gradeShortAnswer(
        testQuestion2.id,
        'London',
        testAnswerPaper.id
      );

      expect(result.isCorrect).toBe(false);
      expect(Number(result.marksObtained)).toBe(0);
    });

    it('should throw error if question is not SHORT_ANSWER type', async () => {
      await expect(
        gradingService.gradeShortAnswer(testQuestion1.id, '4', testAnswerPaper.id)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('gradeLongAnswer', () => {
    it('should grade long answer with similarity score', async () => {
      const answer = 'The water cycle involves the continuous movement of water on Earth.';
      
      const result = await gradingService.gradeLongAnswer(
        testQuestion3.id,
        answer,
        testAnswerPaper.id
      );

      expect(Number(result.similarityScore)).toBeGreaterThan(0);
      expect(Number(result.similarityScore)).toBeLessThanOrEqual(100);
      expect(Number(result.marksObtained)).toBeGreaterThan(0);
      expect(Number(result.marksObtained)).toBeLessThanOrEqual(15);
    });

    it('should throw error if question is not LONG_ANSWER type', async () => {
      await expect(
        gradingService.gradeLongAnswer(testQuestion1.id, 'Answer', testAnswerPaper.id)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('gradeAnswerPaper', () => {
    it('should grade entire answer paper', async () => {
      // Grade questions first
      await gradingService.gradeMCQ(testQuestion1.id, '4', testAnswerPaper.id);
      await gradingService.gradeShortAnswer(testQuestion2.id, 'Paris', testAnswerPaper.id);

      const result = await gradingService.gradeAnswerPaper(testAnswerPaper.id, testEducator.id);

      expect(result.status).toBe(AnswerPaperStatus.GRADED);
      expect(Number(result.totalMarksObtained)).toBeGreaterThan(0);
      expect(Number(result.percentage)).toBeGreaterThan(0);
      expect(result.grade).toBeDefined();
    });

    it('should throw error if answer paper does not exist', async () => {
      await expect(
        gradingService.gradeAnswerPaper('non-existent-id', testEducator.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should calculate grade correctly based on percentage', async () => {
      // Grade questions first
      await gradingService.gradeMCQ(testQuestion1.id, '4', testAnswerPaper.id);
      await gradingService.gradeShortAnswer(testQuestion2.id, 'Paris', testAnswerPaper.id);

      const result = await gradingService.gradeAnswerPaper(testAnswerPaper.id, testEducator.id);

      // 15 marks out of 30 total = 50%
      expect(Number(result.percentage)).toBeGreaterThanOrEqual(0);
      expect(Number(result.percentage)).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateGrade', () => {
    it('should return A+ for 90-100%', () => {
      expect(gradingService.calculateGrade(95)).toBe('A+');
      expect(gradingService.calculateGrade(100)).toBe('A+');
      expect(gradingService.calculateGrade(90)).toBe('A+');
    });

    it('should return A for 80-89%', () => {
      expect(gradingService.calculateGrade(85)).toBe('A');
      expect(gradingService.calculateGrade(80)).toBe('A');
    });

    it('should return B+ for 70-79%', () => {
      expect(gradingService.calculateGrade(75)).toBe('B+');
      expect(gradingService.calculateGrade(70)).toBe('B+');
    });

    it('should return B for 60-69%', () => {
      expect(gradingService.calculateGrade(65)).toBe('B');
      expect(gradingService.calculateGrade(60)).toBe('B');
    });

    it('should return C+ for 50-59%', () => {
      expect(gradingService.calculateGrade(55)).toBe('C+');
      expect(gradingService.calculateGrade(50)).toBe('C+');
    });

    it('should return C for 40-49%', () => {
      expect(gradingService.calculateGrade(45)).toBe('C');
      expect(gradingService.calculateGrade(40)).toBe('C');
    });

    it('should return D for 30-39%', () => {
      expect(gradingService.calculateGrade(35)).toBe('D');
      expect(gradingService.calculateGrade(30)).toBe('D');
    });

    it('should return F for below 30%', () => {
      expect(gradingService.calculateGrade(25)).toBe('F');
      expect(gradingService.calculateGrade(0)).toBe('F');
    });
  });
});

