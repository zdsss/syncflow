import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from './update-task.dto';

describe('Task DTOs', () => {
  describe('CreateTaskDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(CreateTaskDto, {
        name: 'Battery Test',
        projectId: 'proj-1',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when name is empty', async () => {
      const dto = plainToInstance(CreateTaskDto, {
        name: '',
        projectId: 'proj-1',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should fail validation when name is missing', async () => {
      const dto = plainToInstance(CreateTaskDto, {
        projectId: 'proj-1',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should fail validation when projectId is empty', async () => {
      const dto = plainToInstance(CreateTaskDto, {
        name: 'Battery Test',
        projectId: '',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'projectId')).toBe(true);
    });

    it('should fail validation when projectId is missing', async () => {
      const dto = plainToInstance(CreateTaskDto, {
        name: 'Battery Test',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'projectId')).toBe(true);
    });

    it('should accept optional fields', async () => {
      const dto = plainToInstance(CreateTaskDto, {
        name: 'Battery Test',
        projectId: 'proj-1',
        type: 'development',
        priority: 'high',
        status: 'in_progress',
        assigneeId: 'user-1',
        planStart: '2024-01-01',
        planEnd: '2024-06-30',
        progress: 50,
        description: 'Test description',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid progress (over 100)', async () => {
      const dto = plainToInstance(CreateTaskDto, {
        name: 'Battery Test',
        projectId: 'proj-1',
        progress: 150,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'progress')).toBe(true);
    });

    it('should reject negative progress', async () => {
      const dto = plainToInstance(CreateTaskDto, {
        name: 'Battery Test',
        projectId: 'proj-1',
        progress: -10,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'progress')).toBe(true);
    });
  });

  describe('UpdateTaskDto', () => {
    it('should pass validation with partial data', async () => {
      const dto = plainToInstance(UpdateTaskDto, {
        name: 'Updated Task',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with empty object', async () => {
      const dto = plainToInstance(UpdateTaskDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
