import { prisma } from '../config/database';
import * as postService from '../services/postService';
import * as categoryService from '../services/categoryService';
import { createTestUser } from '../tests/setup';
import { NotFoundError, ValidationError } from '../utils/errors';

// Test fixtures
let testUser: any;
let testCategory: any;

// Clean up before and after tests
beforeAll(async () => {
  // Create test category (before users are deleted)
  testCategory = await categoryService.create({
    name: 'Student',
    slug: 'student',
    description: 'Content for students'
  });
});

beforeEach(async () => {
  // Clean up posts
  await prisma.post.deleteMany({});
  
  // Create test user (after beforeEach in setup.ts deletes users)
  testUser = await createTestUser({
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User'
  });
});

// Don't delete posts in afterEach - let beforeEach handle cleanup
// This allows tests to create posts and verify they exist

afterAll(async () => {
  await prisma.post.deleteMany({});
  await prisma.category.deleteMany({});
  if (testUser?.id) {
    await prisma.user.deleteMany({ where: { id: testUser.id } });
  }
  await prisma.$disconnect();
});

describe('PostService', () => {
  describe('create', () => {
    it('should create a post with valid data', async () => {
      const data = {
        title: 'Test Post',
        slug: 'test-post',
        content: 'This is test content',
        excerpt: 'Test excerpt',
        authorId: testUser.id,
        categoryId: testCategory.id,
        status: 'DRAFT' as const
      };

      const post = await postService.create(data);

      expect(post).toHaveProperty('id');
      expect(post.title).toBe(data.title);
      expect(post.slug).toBe(data.slug);
      expect(post.content).toBe(data.content);
      expect(post.status).toBe('DRAFT');
    });

    it('should throw error if title is missing', async () => {
      const data = {
        slug: 'test-post-2',
        content: 'Content',
        authorId: testUser.id
      };

      await expect(
        postService.create(data as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error if slug is missing', async () => {
      const data = {
        title: 'Test Post',
        content: 'Content',
        authorId: testUser.id
      };

      await expect(
        postService.create(data as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error if content is missing', async () => {
      const data = {
        title: 'Test Post',
        slug: 'test-post-3',
        authorId: testUser.id
      };

      await expect(
        postService.create(data as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error if author does not exist', async () => {
      const data = {
        title: 'Test Post',
        slug: 'test-post-4',
        content: 'Content',
        authorId: 'non-existent-id'
      };

      await expect(
        postService.create(data)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if slug already exists', async () => {
      // Create first post
      await postService.create({
        title: 'First Post',
        slug: 'duplicate-slug',
        content: 'Content',
        authorId: testUser.id
      });

      // Try to create duplicate
      const data = {
        title: 'Duplicate Slug Post',
        slug: 'duplicate-slug',
        content: 'Content',
        authorId: testUser.id
      };

      await expect(
        postService.create(data)
      ).rejects.toThrow(ValidationError);
    });

    it('should create post with published status', async () => {
      const data = {
        title: 'Published Post',
        slug: 'published-post',
        content: 'Published content',
        authorId: testUser.id,
        status: 'PUBLISHED' as const
      };

      const post = await postService.create(data);

      expect(post.status).toBe('PUBLISHED');
      expect(post.publishedAt).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should return all posts', async () => {
      // Create some posts first
      await postService.create({
        title: 'Post 1',
        slug: 'post-1',
        content: 'Content 1',
        authorId: testUser.id
      });
      await postService.create({
        title: 'Post 2',
        slug: 'post-2',
        content: 'Content 2',
        authorId: testUser.id
      });

      const posts = await postService.getAll();

      expect(posts.length).toBeGreaterThanOrEqual(2);
      expect(posts[0]).toHaveProperty('id');
      expect(posts[0]).toHaveProperty('title');
    });

    it('should filter by status', async () => {
      const publishedPosts = await postService.getAll({ status: 'PUBLISHED' });
      const draftPosts = await postService.getAll({ status: 'DRAFT' });

      expect(publishedPosts.every(p => p.status === 'PUBLISHED')).toBe(true);
      expect(draftPosts.every(p => p.status === 'DRAFT')).toBe(true);
    });

    it('should filter by category', async () => {
      const posts = await postService.getAll({ categoryId: testCategory.id });

      expect(posts.every(p => p.categoryId === testCategory.id)).toBe(true);
    });
  });

  describe('getBySlug', () => {
    it('should return post by slug', async () => {
      // Create post first
      const created = await postService.create({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        authorId: testUser.id
      });

      const post = await postService.getBySlug('test-post');

      expect(post).toBeDefined();
      expect(post?.slug).toBe('test-post');
      expect(post?.id).toBe(created.id);
    });

    it('should return null if post not found', async () => {
      const post = await postService.getBySlug('non-existent-slug');

      expect(post).toBeNull();
    });
  });

  describe('getById', () => {
    it('should return post by ID', async () => {
      const created = await postService.create({
        title: 'Get By ID Post',
        slug: 'get-by-id-post',
        content: 'Content',
        authorId: testUser.id
      });

      const post = await postService.getById(created.id);

      expect(post).toBeDefined();
      expect(post?.id).toBe(created.id);
    });

    it('should return null if post not found', async () => {
      const post = await postService.getById('non-existent-id');

      expect(post).toBeNull();
    });
  });

  describe('update', () => {
    it('should update post', async () => {
      const post = await postService.create({
        title: 'Update Test Post',
        slug: 'update-test-post',
        content: 'Original content',
        authorId: testUser.id
      });

      const updated = await postService.update(post.id, {
        title: 'Updated Title',
        content: 'Updated content'
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.content).toBe('Updated content');
    });

    it('should throw error if post not found', async () => {
      await expect(
        postService.update('non-existent-id', { title: 'Test' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should update status to PUBLISHED', async () => {
      const post = await postService.create({
        title: 'Publish Test',
        slug: 'publish-test',
        content: 'Content',
        authorId: testUser.id,
        status: 'DRAFT'
      });

      const updated = await postService.update(post.id, {
        status: 'PUBLISHED'
      });

      expect(updated.status).toBe('PUBLISHED');
      expect(updated.publishedAt).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete post', async () => {
      const post = await postService.create({
        title: 'Delete Test Post',
        slug: 'delete-test-post',
        content: 'To be deleted',
        authorId: testUser.id
      });

      await postService.delete(post.id);

      const deleted = await postService.getById(post.id);
      expect(deleted).toBeNull();
    });

    it('should throw error if post not found', async () => {
      await expect(
        postService.delete('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });
});

