import { prisma } from '../config/database';
import * as questionPaperService from '../services/questionPaperService';
import { createTestUser } from '../tests/setup';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { QuestionPaperStatus } from '@prisma/client';

// Test fixtures
let testEducator: any;
let testStudent: any;

beforeEach(async () => {
  // Clean up question papers and questions
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

describe('QuestionPaperService', () => {
  describe('create', () => {
    it('should create a question paper with valid data', async () => {
      const data = {
        title: 'Math Test 1',
        description: 'Basic math test',
        educatorId: testEducator.id,
        totalMarks: 100,
        durationMinutes: 60,
        subject: 'Mathematics',
        gradeLevel: '10th Grade'
      };

      const paper = await questionPaperService.create(data);

      expect(paper).toBeDefined();
      expect(paper.title).toBe(data.title);
      expect(paper.educatorId).toBe(testEducator.id);
      expect(paper.status).toBe(QuestionPaperStatus.DRAFT);
      expect(paper.totalMarks).toBe(100);
    });

    it('should throw error if educator does not exist', async () => {
      const data = {
        title: 'Math Test 1',
        educatorId: 'non-existent-id',
        totalMarks: 100
      };

      await expect(questionPaperService.create(data)).rejects.toThrow(NotFoundError);
    });

    it('should throw error if user is not an educator', async () => {
      const data = {
        title: 'Math Test 1',
        educatorId: testStudent.id,
        totalMarks: 100
      };

      await expect(questionPaperService.create(data)).rejects.toThrow(ForbiddenError);
    });

    it('should throw error if title is missing', async () => {
      const data = {
        educatorId: testEducator.id,
        totalMarks: 100
      } as any;

      await expect(questionPaperService.create(data)).rejects.toThrow(ValidationError);
    });

    it('should throw error if totalMarks is missing', async () => {
      const data = {
        title: 'Math Test 1',
        educatorId: testEducator.id
      } as any;

      await expect(questionPaperService.create(data)).rejects.toThrow(ValidationError);
    });

    it('should set default status to DRAFT', async () => {
      const data = {
        title: 'Math Test 1',
        educatorId: testEducator.id,
        totalMarks: 100
      };

      const paper = await questionPaperService.create(data);
      expect(paper.status).toBe(QuestionPaperStatus.DRAFT);
    });
  });

  describe('getAll', () => {
    it('should return all question papers', async () => {
      // Create test papers
      await questionPaperService.create({
        title: 'Paper 1',
        educatorId: testEducator.id,
        totalMarks: 100
      });
      await questionPaperService.create({
        title: 'Paper 2',
        educatorId: testEducator.id,
        totalMarks: 50
      });

      const papers = await questionPaperService.getAll();

      expect(papers.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by educatorId', async () => {
      // Create another educator
      const educator2 = await createTestUser({
        email: 'educator2@example.com',
        password: 'Password123!',
        name: 'Educator 2',
        role: 'EDUCATOR'
      });

      await questionPaperService.create({
        title: 'Paper 1',
        educatorId: testEducator.id,
        totalMarks: 100
      });
      await questionPaperService.create({
        title: 'Paper 2',
        educatorId: educator2.id,
        totalMarks: 50
      });

      const papers = await questionPaperService.getAll({ educatorId: testEducator.id });

      expect(papers.length).toBe(1);
      expect(papers[0].educatorId).toBe(testEducator.id);

      // Cleanup
      await prisma.user.deleteMany({ where: { id: educator2.id } });
    });

    it('should filter by status', async () => {
      await questionPaperService.create({
        title: 'Draft Paper',
        educatorId: testEducator.id,
        totalMarks: 100,
        status: QuestionPaperStatus.DRAFT
      });
      await questionPaperService.create({
        title: 'Published Paper',
        educatorId: testEducator.id,
        totalMarks: 50,
        status: QuestionPaperStatus.PUBLISHED
      });

      const published = await questionPaperService.getAll({ status: QuestionPaperStatus.PUBLISHED });

      expect(published.length).toBe(1);
      expect(published[0].status).toBe(QuestionPaperStatus.PUBLISHED);
    });
  });

  describe('getById', () => {
    it('should return question paper by id', async () => {
      const created = await questionPaperService.create({
        title: 'Test Paper',
        educatorId: testEducator.id,
        totalMarks: 100
      });

      const paper = await questionPaperService.getById(created.id);

      expect(paper).toBeDefined();
      expect(paper?.id).toBe(created.id);
      expect(paper?.title).toBe('Test Paper');
    });

    it('should return null if paper does not exist', async () => {
      const paper = await questionPaperService.getById('non-existent-id');
      expect(paper).toBeNull();
    });
  });

  describe('update', () => {
    it('should update question paper', async () => {
      const created = await questionPaperService.create({
        title: 'Original Title',
        educatorId: testEducator.id,
        totalMarks: 100
      });

      const updated = await questionPaperService.update(created.id, {
        title: 'Updated Title',
        totalMarks: 150
      }, testEducator.id);

      expect(updated.title).toBe('Updated Title');
      expect(updated.totalMarks).toBe(150);
    });

    it('should throw error if paper does not exist', async () => {
      await expect(
        questionPaperService.update('non-existent-id', { title: 'New Title' }, testEducator.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if user is not the educator', async () => {
      const created = await questionPaperService.create({
        title: 'Test Paper',
        educatorId: testEducator.id,
        totalMarks: 100
      });

      // Try to update as student
      await expect(
        questionPaperService.update(created.id, { title: 'Hacked Title' }, testStudent.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should allow admin to update any paper', async () => {
      const admin = await createTestUser({
        email: 'admin@example.com',
        password: 'Password123!',
        name: 'Admin',
        role: 'ADMIN'
      });

      const created = await questionPaperService.create({
        title: 'Test Paper',
        educatorId: testEducator.id,
        totalMarks: 100
      });

      const updated = await questionPaperService.update(created.id, {
        title: 'Admin Updated Title'
      }, admin.id);

      expect(updated.title).toBe('Admin Updated Title');

      // Cleanup
      await prisma.user.deleteMany({ where: { id: admin.id } });
    });
  });

  describe('delete', () => {
    it('should delete question paper', async () => {
      const created = await questionPaperService.create({
        title: 'To Delete',
        educatorId: testEducator.id,
        totalMarks: 100
      });

      await questionPaperService.delete(created.id, testEducator.id);

      const paper = await questionPaperService.getById(created.id);
      expect(paper).toBeNull();
    });

    it('should throw error if paper does not exist', async () => {
      await expect(
        questionPaperService.delete('non-existent-id', testEducator.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if user is not the educator', async () => {
      const created = await questionPaperService.create({
        title: 'Test Paper',
        educatorId: testEducator.id,
        totalMarks: 100
      });

      await expect(
        questionPaperService.delete(created.id, testStudent.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should cascade delete questions', async () => {
      const created = await questionPaperService.create({
        title: 'Paper with Questions',
        educatorId: testEducator.id,
        totalMarks: 100
      });

      // Create a question
      await prisma.question.create({
        data: {
          questionPaperId: created.id,
          questionNumber: 1,
          questionText: 'What is 2+2?',
          questionType: 'MCQ',
          marks: 10,
          correctAnswer: '4'
        }
      });

      await questionPaperService.delete(created.id, testEducator.id);

      const questions = await prisma.question.findMany({
        where: { questionPaperId: created.id }
      });
      expect(questions.length).toBe(0);
    });
  });
});

