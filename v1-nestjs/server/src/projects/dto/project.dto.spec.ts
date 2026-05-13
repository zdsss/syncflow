import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProjectDto } from './create-project.dto';
import { UpdateProjectDto } from './update-project.dto';

describe('Project DTOs', () => {
  describe('CreateProjectDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        name: 'Battery Project',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when name is empty', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        name: '',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should fail validation when name is missing', async () => {
      const dto = plainToInstance(CreateProjectDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should accept all optional fields', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        name: 'Battery Project',
        description: 'A test project',
        parentId: 'parent-1',
        category: 'R&D',
        phase: 'design',
        status: 'active',
        leaderId: 'user-1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('UpdateProjectDto', () => {
    it('should pass validation with partial data', async () => {
      const dto = plainToInstance(UpdateProjectDto, {
        name: 'Updated Project',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with empty object', async () => {
      const dto = plainToInstance(UpdateProjectDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
