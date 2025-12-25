import { prisma } from '../config/database';
import * as answerPaperService from '../services/answerPaperService';
import * as questionPaperService from '../services/questionPaperService';
import { createTestUser } from '../tests/setup';
import { NotFoundError, ValidationError } from '../utils/errors';
import { AnswerPaperStatus } from '@prisma/client';

// Test fixtures
let testStudent: any;
let testEducator: any;
let testPaper: any;

beforeEach(async () => {
  // Clean up answer papers and files
  await prisma.answerFile.deleteMany({});
  await prisma.questionAnswer.deleteMany({});
  await prisma.answerPaper.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.questionPaper.deleteMany({});
  
  // Create test student
  testStudent = await createTestUser({
    email: 'student@example.com',
    password: 'Password123!',
    name: 'Test Student',
    role: 'STUDENT'
  });

  // Create test educator
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
});

afterAll(async () => {
  await prisma.answerFile.deleteMany({});
  await prisma.questionAnswer.deleteMany({});
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

describe('AnswerPaperService', () => {
  describe('create', () => {
    it('should create an answer paper with valid data', async () => {
      const data = {
        questionPaperId: testPaper.id,
        studentId: testStudent.id
      };

      const answerPaper = await answerPaperService.create(data);

      expect(answerPaper).toBeDefined();
      expect(answerPaper.questionPaperId).toBe(testPaper.id);
      expect(answerPaper.studentId).toBe(testStudent.id);
      expect(answerPaper.status).toBe(AnswerPaperStatus.SUBMITTED);
    });

    it('should throw error if question paper does not exist', async () => {
      const data = {
        questionPaperId: 'non-existent-id',
        studentId: testStudent.id
      };

      await expect(answerPaperService.create(data)).rejects.toThrow(NotFoundError);
    });

    it('should throw error if student does not exist', async () => {
      const data = {
        questionPaperId: testPaper.id,
        studentId: 'non-existent-id'
      };

      await expect(answerPaperService.create(data)).rejects.toThrow(NotFoundError);
    });

    it('should throw error if question paper is not published', async () => {
      // Create a draft paper
      const draftPaper = await questionPaperService.create({
        title: 'Draft Paper',
        educatorId: testEducator.id,
        totalMarks: 50,
        status: 'DRAFT'
      });

      const data = {
        questionPaperId: draftPaper.id,
        studentId: testStudent.id
      };

      await expect(answerPaperService.create(data)).rejects.toThrow(ValidationError);
    });

    it('should prevent duplicate submissions from same student', async () => {
      const data = {
        questionPaperId: testPaper.id,
        studentId: testStudent.id
      };

      // Create first submission
      await answerPaperService.create(data);

      // Try to create duplicate
      await expect(answerPaperService.create(data)).rejects.toThrow(ValidationError);
    });
  });

  describe('getAll', () => {
    it('should return all answer papers', async () => {
      await answerPaperService.create({
        questionPaperId: testPaper.id,
        studentId: testStudent.id
      });

      const papers = await answerPaperService.getAll();

      expect(papers.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by studentId', async () => {
      // Create another student
      const student2 = await createTestUser({
        email: 'student2@example.com',
        password: 'Password123!',
        name: 'Student 2',
        role: 'STUDENT'
      });

      await answerPaperService.create({
        questionPaperId: testPaper.id,
        studentId: testStudent.id
      });
      await answerPaperService.create({
        questionPaperId: testPaper.id,
        studentId: student2.id
      });

      const papers = await answerPaperService.getAll({ studentId: testStudent.id });

      expect(papers.length).toBe(1);
      expect(papers[0].studentId).toBe(testStudent.id);

      // Cleanup
      await prisma.user.deleteMany({ where: { id: student2.id } });
    });

    it('should filter by questionPaperId', async () => {
      const paper2 = await questionPaperService.create({
        title: 'Paper 2',
        educatorId: testEducator.id,
        totalMarks: 50,
        status: 'PUBLISHED'
      });

      await answerPaperService.create({
        questionPaperId: testPaper.id,
        studentId: testStudent.id
      });
      await answerPaperService.create({
        questionPaperId: paper2.id,
        studentId: testStudent.id
      });

      const papers = await answerPaperService.getAll({ questionPaperId: testPaper.id });

      expect(papers.length).toBe(1);
      expect(papers[0].questionPaperId).toBe(testPaper.id);
    });

    it('should filter by status', async () => {
      await answerPaperService.create({
        questionPaperId: testPaper.id,
        studentId: testStudent.id
      });

      const submitted = await answerPaperService.getAll({ status: AnswerPaperStatus.SUBMITTED });

      expect(submitted.length).toBeGreaterThanOrEqual(1);
      expect(submitted[0].status).toBe(AnswerPaperStatus.SUBMITTED);
    });
  });

  describe('getById', () => {
    it('should return answer paper by id', async () => {
      const created = await answerPaperService.create({
        questionPaperId: testPaper.id,
        studentId: testStudent.id
      });

      const paper = await answerPaperService.getById(created.id);

      expect(paper).toBeDefined();
      expect(paper?.id).toBe(created.id);
      expect(paper?.studentId).toBe(testStudent.id);
    });

    it('should return null if paper does not exist', async () => {
      const paper = await answerPaperService.getById('non-existent-id');
      expect(paper).toBeNull();
    });
  });

  describe('getByStudent', () => {
    it('should return answer papers for a student', async () => {
      await answerPaperService.create({
        questionPaperId: testPaper.id,
        studentId: testStudent.id
      });

      const papers = await answerPaperService.getByStudent(testStudent.id);

      expect(papers.length).toBeGreaterThanOrEqual(1);
      expect(papers[0].studentId).toBe(testStudent.id);
    });
  });

  describe('updateStatus', () => {
    it('should update answer paper status', async () => {
      const created = await answerPaperService.create({
        questionPaperId: testPaper.id,
        studentId: testStudent.id
      });

      const updated = await answerPaperService.updateStatus(
        created.id,
        AnswerPaperStatus.GRADING,
        testEducator.id
      );

      expect(updated.status).toBe(AnswerPaperStatus.GRADING);
    });

    it('should throw error if paper does not exist', async () => {
      await expect(
        answerPaperService.updateStatus('non-existent-id', AnswerPaperStatus.GRADING, testEducator.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('addFile', () => {
    it('should add a file to answer paper', async () => {
      const answerPaper = await answerPaperService.create({
        questionPaperId: testPaper.id,
        studentId: testStudent.id
      });

      const file = await answerPaperService.addFile(answerPaper.id, {
        fileName: 'answer.pdf',
        filePath: '/uploads/answer.pdf',
        fileType: 'PDF',
        fileSize: 1024
      });

      expect(file).toBeDefined();
      expect(file.fileName).toBe('answer.pdf');
      expect(file.answerPaperId).toBe(answerPaper.id);
    });

    it('should throw error if answer paper does not exist', async () => {
      await expect(
        answerPaperService.addFile('non-existent-id', {
          fileName: 'test.pdf',
          filePath: '/uploads/test.pdf',
          fileType: 'PDF',
          fileSize: 1024
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getFiles', () => {
    it('should return all files for an answer paper', async () => {
      const answerPaper = await answerPaperService.create({
        questionPaperId: testPaper.id,
        studentId: testStudent.id
      });

      await answerPaperService.addFile(answerPaper.id, {
        fileName: 'answer1.pdf',
        filePath: '/uploads/answer1.pdf',
        fileType: 'PDF',
        fileSize: 1024
      });
      await answerPaperService.addFile(answerPaper.id, {
        fileName: 'answer2.pdf',
        filePath: '/uploads/answer2.pdf',
        fileType: 'PDF',
        fileSize: 2048
      });

      const files = await answerPaperService.getFiles(answerPaper.id);

      expect(files.length).toBe(2);
    });

    it('should return empty array if no files exist', async () => {
      const answerPaper = await answerPaperService.create({
        questionPaperId: testPaper.id,
        studentId: testStudent.id
      });

      const files = await answerPaperService.getFiles(answerPaper.id);
      expect(files.length).toBe(0);
    });
  });
});

