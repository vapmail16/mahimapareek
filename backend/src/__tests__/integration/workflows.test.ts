/**
 * Integration Tests - End-to-End Workflows
 * 
 * Tests complete user journeys across multiple services and endpoints
 */

import request from 'supertest';
import { prisma } from '../../config/database';
import app from '../../app';

describe('E2E Workflows', () => {
  let educatorToken: string;
  let studentToken: string;
  let questionPaperId: string;
  let answerPaperId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.questionAnswer.deleteMany({});
    await prisma.answerFile.deleteMany({});
    await prisma.answerPaper.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.questionPaper.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    // Clean up
    await prisma.questionAnswer.deleteMany({});
    await prisma.answerFile.deleteMany({});
    await prisma.answerPaper.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.questionPaper.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Workflow 1: Complete Question Paper to Grading Flow', () => {
    it('should complete full workflow: register → login → create paper → add questions → submit answer → grade → view results', async () => {
      // Step 1: Register Educator (users are created as USER by default, need to update role)
      const educatorRegisterRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'educator@test.com',
          password: 'Test123!@#',
          name: 'Test Educator',
        });

      expect(educatorRegisterRes.status).toBe(201);
      
      // Update role to EDUCATOR (registration creates USER by default)
      const educatorUserId = educatorRegisterRes.body.data.id;
      await prisma.user.update({
        where: { id: educatorUserId },
        data: { role: 'EDUCATOR' },
      });

      // Step 2: Login as Educator
      const educatorLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'educator@test.com',
          password: 'Test123!@#',
        });

      expect(educatorLoginRes.status).toBe(200);
      educatorToken = educatorLoginRes.body.data.accessToken;
      expect(educatorToken).toBeDefined();

      // Step 3: Create Question Paper
      const paperRes = await request(app)
        .post('/api/question-papers')
        .set('Authorization', `Bearer ${educatorToken}`)
        .send({
          title: 'E2E Test Paper',
          subject: 'Mathematics',
          totalMarks: 100,
          description: 'Test paper for E2E workflow',
        });

      expect(paperRes.status).toBe(201);
      questionPaperId = paperRes.body.data.id;

      // Step 4: Add MCQ Question
      const mcqRes = await request(app)
        .post(`/api/questions/paper/${questionPaperId}`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send({
          questionNumber: 1,
          questionText: 'What is 2+2?',
          questionType: 'MCQ',
          marks: 50,
          correctAnswer: '4',
          options: ['2', '3', '4', '5'],
        });

      expect(mcqRes.status).toBe(201);

      // Step 5: Add Short Answer Question
      const shortAnswerRes = await request(app)
        .post(`/api/questions/paper/${questionPaperId}`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send({
          questionNumber: 2,
          questionText: 'What is the capital of France?',
          questionType: 'SHORT_ANSWER',
          marks: 50,
          answerKeywords: ['Paris', 'paris'],
        });

      expect(shortAnswerRes.status).toBe(201);

      // Step 6: Publish Question Paper
      const publishRes = await request(app)
        .put(`/api/question-papers/${questionPaperId}`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send({
          status: 'PUBLISHED',
        });

      expect(publishRes.status).toBe(200);

      // Step 7: Register Student
      const studentRegisterRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'student@test.com',
          password: 'Test123!@#',
          name: 'Test Student',
        });

      expect(studentRegisterRes.status).toBe(201);
      
      // Update role to STUDENT
      const studentUserId = studentRegisterRes.body.data.id;
      await prisma.user.update({
        where: { id: studentUserId },
        data: { role: 'STUDENT' },
      });

      // Step 8: Login as Student
      const studentLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'Test123!@#',
        });

      expect(studentLoginRes.status).toBe(200);
      studentToken = studentLoginRes.body.data.accessToken;
      expect(studentToken).toBeDefined();

      // Step 9: Submit Answer Paper
      const answerPaperRes = await request(app)
        .post('/api/answer-papers')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          questionPaperId,
        });

      expect(answerPaperRes.status).toBe(201);
      answerPaperId = answerPaperRes.body.data.id;

      // Step 10: Submit Answers via Grading Endpoints
      const questions = await prisma.question.findMany({
        where: { questionPaperId },
        orderBy: { questionNumber: 'asc' },
      });

      // Submit MCQ answer (grading endpoint creates the answer)
      const mcqAnswer = await request(app)
        .post(`/api/grading/mcq/${questions[0].id}`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send({
          answerPaperId,
          answer: '4',
        });

      expect(mcqAnswer.status).toBe(200);

      // Submit Short Answer
      const shortAnswer = await request(app)
        .post(`/api/grading/short-answer/${questions[1].id}`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send({
          answerPaperId,
          answer: 'Paris',
        });

      expect(shortAnswer.status).toBe(200);

      // Step 11: Grade Answer Paper
      const gradeRes = await request(app)
        .post(`/api/grading/paper/${answerPaperId}`)
        .set('Authorization', `Bearer ${educatorToken}`);

      expect(gradeRes.status).toBe(200);
      expect(gradeRes.body.data.status).toBe('GRADED');
      expect(gradeRes.body.data.totalMarksObtained).toBeGreaterThan(0);

      // Step 12: View Results as Student
      const resultRes = await request(app)
        .get(`/api/results/${answerPaperId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(resultRes.status).toBe(200);
      expect(resultRes.body.data.totalMarksObtained).toBeDefined();
      expect(resultRes.body.data.questionBreakdown.length).toBe(2);

      // Step 13: View Results as Educator
      const educatorResultRes = await request(app)
        .get(`/api/results/${answerPaperId}`)
        .set('Authorization', `Bearer ${educatorToken}`);

      expect(educatorResultRes.status).toBe(200);

      // Step 14: Export Results
      const exportRes = await request(app)
        .get(`/api/results/${answerPaperId}/export/csv`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(exportRes.status).toBe(200);
      expect(exportRes.headers['content-type']).toContain('text/csv');
    }, 30000); // 30 second timeout for full workflow
  });

  describe('Workflow 2: Question Paper Management Flow', () => {
    it('should allow educator to create, edit, and manage question papers', async () => {
      // Create paper
      const createRes = await request(app)
        .post('/api/question-papers')
        .set('Authorization', `Bearer ${educatorToken}`)
        .send({
          title: 'Management Test Paper',
          subject: 'Science',
          totalMarks: 50,
        });

      expect(createRes.status).toBe(201);
      const paperId = createRes.body.data.id;

      // Add questions
      const questionRes = await request(app)
        .post(`/api/questions/paper/${paperId}`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send({
          questionNumber: 1,
          questionText: 'Test Question',
          questionType: 'MCQ',
          marks: 50,
          correctAnswer: 'A',
          options: ['A', 'B', 'C', 'D'],
        });

      expect(questionRes.status).toBe(201);

      // Update paper
      const updateRes = await request(app)
        .put(`/api/question-papers/${paperId}`)
        .set('Authorization', `Bearer ${educatorToken}`)
        .send({
          title: 'Updated Management Test Paper',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.title).toBe('Updated Management Test Paper');

      // Get all papers
      const listRes = await request(app)
        .get('/api/question-papers')
        .set('Authorization', `Bearer ${educatorToken}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);

      // Delete question
      const deleteQuestionRes = await request(app)
        .delete(`/api/questions/${questionRes.body.data.id}`)
        .set('Authorization', `Bearer ${educatorToken}`);

      expect(deleteQuestionRes.status).toBe(200);
    });
  });

  describe('Workflow 3: Authorization & Access Control', () => {
    it('should enforce proper authorization across all endpoints', async () => {
      // Student cannot create question papers
      const studentCreatePaper = await request(app)
        .post('/api/question-papers')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Unauthorized Paper',
          totalMarks: 100,
        });

      expect(studentCreatePaper.status).toBe(403);

      // Student cannot grade papers
      const studentGrade = await request(app)
        .post(`/api/grading/paper/${answerPaperId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(studentGrade.status).toBe(403);

      // Student can only view their own results
      const ownResults = await request(app)
        .get(`/api/results/${answerPaperId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(ownResults.status).toBe(200);

      // Educator can view all results for their papers
      const educatorResults = await request(app)
        .get(`/api/results/question-paper/${questionPaperId}`)
        .set('Authorization', `Bearer ${educatorToken}`);

      expect(educatorResults.status).toBe(200);
    });
  });

  describe('Workflow 4: File Upload & Processing', () => {
    it('should handle file upload workflow correctly', async () => {
      // Create answer paper
      const answerPaperRes = await request(app)
        .post('/api/answer-papers')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          questionPaperId,
        });

      const newAnswerPaperId = answerPaperRes.body.data.id;

      // Upload file (simulate with text file)
      const fileContent = Buffer.from('Test answer content');
      const uploadRes = await request(app)
        .post(`/api/answer-papers/${newAnswerPaperId}/files`)
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('files', fileContent, 'test-answer.txt');

      expect(uploadRes.status).toBe(201);
      expect(uploadRes.body.data.length).toBeGreaterThan(0);

      // Get files
      const getFilesRes = await request(app)
        .get(`/api/answer-papers/${newAnswerPaperId}/files`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(getFilesRes.status).toBe(200);
      expect(Array.isArray(getFilesRes.body.data)).toBe(true);
    });
  });
});

