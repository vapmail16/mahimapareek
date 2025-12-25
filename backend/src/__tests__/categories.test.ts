import { prisma } from '../config/database';
import * as categoryService from '../services/categoryService';
import { NotFoundError, ValidationError } from '../utils/errors';

// Clean up before and after tests
beforeAll(async () => {
  await prisma.category.deleteMany({});
});

afterAll(async () => {
  await prisma.category.deleteMany({});
  await prisma.$disconnect();
});

describe('CategoryService', () => {
  describe('create', () => {
    it('should create a category with valid data', async () => {
      const data = {
        name: 'Student',
        slug: 'student',
        description: 'Content for students'
      };

      const category = await categoryService.create(data);

      expect(category).toHaveProperty('id');
      expect(category.name).toBe(data.name);
      expect(category.slug).toBe(data.slug);
      expect(category.description).toBe(data.description);
    });

    it('should throw error if name is missing', async () => {
      const data = {
        slug: 'test',
        description: 'Test description'
      };

      await expect(
        categoryService.create(data as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error if slug is missing', async () => {
      const data = {
        name: 'Test Category',
        description: 'Test description'
      };

      await expect(
        categoryService.create(data as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error if name already exists', async () => {
      const data = {
        name: 'Student',
        slug: 'student-duplicate',
        description: 'Duplicate name'
      };

      await expect(
        categoryService.create(data)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error if slug already exists', async () => {
      const data = {
        name: 'Student Duplicate',
        slug: 'student',
        description: 'Duplicate slug'
      };

      await expect(
        categoryService.create(data)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getAll', () => {
    it('should return all categories', async () => {
      // Create test categories
      await categoryService.create({
        name: 'Parent',
        slug: 'parent',
        description: 'Content for parents'
      });

      const categories = await categoryService.getAll();

      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('id');
      expect(categories[0]).toHaveProperty('name');
      expect(categories[0]).toHaveProperty('slug');
    });
  });

  describe('getBySlug', () => {
    it('should return category by slug', async () => {
      const category = await categoryService.getBySlug('student');

      expect(category).toBeDefined();
      expect(category?.slug).toBe('student');
    });

    it('should return null if category not found', async () => {
      const category = await categoryService.getBySlug('non-existent');

      expect(category).toBeNull();
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      const category = await categoryService.getBySlug('student');
      if (!category) throw new Error('Category not found');

      const updated = await categoryService.update(category.id, {
        description: 'Updated description'
      });

      expect(updated.description).toBe('Updated description');
    });

    it('should throw error if category not found', async () => {
      await expect(
        categoryService.update('non-existent-id', { description: 'Test' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete category', async () => {
      const category = await categoryService.create({
        name: 'Test Delete',
        slug: 'test-delete',
        description: 'To be deleted'
      });

      await categoryService.delete(category.id);

      const deleted = await categoryService.getBySlug('test-delete');
      expect(deleted).toBeNull();
    });

    it('should throw error if category not found', async () => {
      await expect(
        categoryService.delete('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });
});

