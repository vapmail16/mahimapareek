import { prisma } from '../config/database';
import * as questionService from '../services/questionService';
import * as questionPaperService from '../services/questionPaperService';
import { createTestUser } from '../tests/setup';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { QuestionType } from '@prisma/client';

// Test fixtures
let testEducator: any;
let testStudent: any;
let testPaper: any;

beforeEach(async () => {
  // Clean up questions and papers
  await prisma.question.deleteMany({});
  await prisma.questionPaper.deleteMany({});
  
  // Create test educator
  testEducator = await createTestUser({
    email: 'educator@example.com',
    password: 'Password123!',
    name: 'Test Educator',
    role: 'EDUCATOR'
  });

  // Create test student
  testStudent = await createTestUser({
    email: 'student@example.com',
    password: 'Password123!',
    name: 'Test Student',
    role: 'STUDENT'
  });

  // Create test paper
  testPaper = await questionPaperService.create({
    title: 'Test Paper',
    educatorId: testEducator.id,
    totalMarks: 100
  });
});

afterAll(async () => {
  await prisma.question.deleteMany({});
  await prisma.questionPaper.deleteMany({});
  if (testEducator?.id) {
    await prisma.user.deleteMany({ where: { id: testEducator.id } });
  }
  if (testStudent?.id) {
    await prisma.user.deleteMany({ where: { id: testStudent.id } });
  }
  await prisma.$disconnect();
});

describe('QuestionService', () => {
  describe('create', () => {
    it('should create a question with valid data', async () => {
      const data = {
        questionPaperId: testPaper.id,
        questionNumber: 1,
        questionText: 'What is 2+2?',
        questionType: QuestionType.MCQ,
        marks: 10,
        correctAnswer: '4',
        options: [{ id: 1, text: '2' }, { id: 2, text: '4' }, { id: 3, text: '6' }]
      };

      const question = await questionService.create(data, testEducator.id);

      expect(question).toBeDefined();
      expect(question.questionText).toBe(data.questionText);
      expect(question.questionType).toBe(QuestionType.MCQ);
      expect(question.marks).toBe(10);
    });

    it('should throw error if question paper does not exist', async () => {
      const data = {
        questionPaperId: 'non-existent-id',
        questionNumber: 1,
        questionText: 'Test',
        questionType: QuestionType.MCQ,
        marks: 10
      };

      await expect(questionService.create(data, testEducator.id)).rejects.toThrow(NotFoundError);
    });

    it('should throw error if user is not the educator', async () => {
      const data = {
        questionPaperId: testPaper.id,
        questionNumber: 1,
        questionText: 'Test',
        questionType: QuestionType.MCQ,
        marks: 10
      };

      await expect(questionService.create(data, testStudent.id)).rejects.toThrow(ForbiddenError);
    });

    it('should throw error if question number already exists', async () => {
      await questionService.create({
        questionPaperId: testPaper.id,
        questionNumber: 1,
        questionText: 'First Question',
        questionType: QuestionType.MCQ,
        marks: 10
      }, testEducator.id);

      const data = {
        questionPaperId: testPaper.id,
        questionNumber: 1, // Duplicate
        questionText: 'Second Question',
        questionType: QuestionType.MCQ,
        marks: 10
      };

      await expect(questionService.create(data, testEducator.id)).rejects.toThrow(ValidationError);
    });

    it('should throw error if required fields are missing', async () => {
      const data = {
        questionPaperId: testPaper.id,
        questionNumber: 1
        // Missing questionText, questionType, marks
      } as any;

      await expect(questionService.create(data, testEducator.id)).rejects.toThrow(ValidationError);
    });

    it('should auto-increment question number if not provided', async () => {
      // Create first question
      await questionService.create({
        questionPaperId: testPaper.id,
        questionNumber: 1,
        questionText: 'Question 1',
        questionType: QuestionType.MCQ,
        marks: 10
      }, testEducator.id);

      // Create second question without specifying number
      const question2 = await questionService.create({
        questionPaperId: testPaper.id,
        questionText: 'Question 2',
        questionType: QuestionType.SHORT_ANSWER,
        marks: 5
      }, testEducator.id);

      expect(question2.questionNumber).toBe(2);
    });
  });

  describe('getAll', () => {
    it('should return all questions for a paper', async () => {
      await questionService.create({
        questionPaperId: testPaper.id,
        questionNumber: 1,
        questionText: 'Question 1',
        questionType: QuestionType.MCQ,
        marks: 10
      }, testEducator.id);

      await questionService.create({
        questionPaperId: testPaper.id,
        questionNumber: 2,
        questionText: 'Question 2',
        questionType: QuestionType.SHORT_ANSWER,
        marks: 5
      }, testEducator.id);

      const questions = await questionService.getAll(testPaper.id);

      expect(questions.length).toBe(2);
      expect(questions[0].questionNumber).toBe(1);
      expect(questions[1].questionNumber).toBe(2);
    });

    it('should return empty array if no questions exist', async () => {
      const questions = await questionService.getAll(testPaper.id);
      expect(questions.length).toBe(0);
    });
  });

  describe('getById', () => {
    it('should return question by id', async () => {
      const created = await questionService.create({
        questionPaperId: testPaper.id,
        questionNumber: 1,
        questionText: 'Test Question',
        questionType: QuestionType.MCQ,
        marks: 10
      }, testEducator.id);

      const question = await questionService.getById(created.id);

      expect(question).toBeDefined();
      expect(question?.id).toBe(created.id);
      expect(question?.questionText).toBe('Test Question');
    });

    it('should return null if question does not exist', async () => {
      const question = await questionService.getById('non-existent-id');
      expect(question).toBeNull();
    });
  });

  describe('update', () => {
    it('should update question', async () => {
      const created = await questionService.create({
        questionPaperId: testPaper.id,
        questionNumber: 1,
        questionText: 'Original Question',
        questionType: QuestionType.MCQ,
        marks: 10
      }, testEducator.id);

      const updated = await questionService.update(created.id, {
        questionText: 'Updated Question',
        marks: 15
      }, testEducator.id);

      expect(updated.questionText).toBe('Updated Question');
      expect(updated.marks).toBe(15);
    });

    it('should throw error if question does not exist', async () => {
      await expect(
        questionService.update('non-existent-id', { questionText: 'New' }, testEducator.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if user is not the educator', async () => {
      const created = await questionService.create({
        questionPaperId: testPaper.id,
        questionNumber: 1,
        questionText: 'Test Question',
        questionType: QuestionType.MCQ,
        marks: 10
      }, testEducator.id);

      await expect(
        questionService.update(created.id, { questionText: 'Hacked' }, testStudent.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('delete', () => {
    it('should delete question', async () => {
      const created = await questionService.create({
        questionPaperId: testPaper.id,
        questionNumber: 1,
        questionText: 'To Delete',
        questionType: QuestionType.MCQ,
        marks: 10
      }, testEducator.id);

      await questionService.delete(created.id, testEducator.id);

      const question = await questionService.getById(created.id);
      expect(question).toBeNull();
    });

    it('should throw error if question does not exist', async () => {
      await expect(
        questionService.delete('non-existent-id', testEducator.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if user is not the educator', async () => {
      const created = await questionService.create({
        questionPaperId: testPaper.id,
        questionNumber: 1,
        questionText: 'Test Question',
        questionType: QuestionType.MCQ,
        marks: 10
      }, testEducator.id);

      await expect(
        questionService.delete(created.id, testStudent.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});

