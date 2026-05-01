import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    task: {
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      task: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should return correct task counts', async () => {
    prisma.task.count
      .mockResolvedValueOnce(25)  // totalTasks
      .mockResolvedValueOnce(5)   // completed
      .mockResolvedValueOnce(5)   // inProgress
      .mockResolvedValueOnce(5)   // overdue
      .mockResolvedValueOnce(5)   // notStarted
      .mockResolvedValueOnce(5)   // pendingAssign
      .mockResolvedValueOnce(0);  // urgent

    const result = await service.getSummary();

    expect(result.totalTasks).toBe(25);
    expect(result.completed).toBe(5);
    expect(result.inProgress).toBe(5);
    expect(result.overdue).toBe(5);
    expect(result.notStarted).toBe(5);
    expect(result.pendingAssign).toBe(5);
    expect(result.urgent).toBe(0);
  });

  it('should return correct structure with all fields', async () => {
    prisma.task.count.mockResolvedValue(0);

    const result = await service.getSummary();

    expect(result).toHaveProperty('totalTasks');
    expect(result).toHaveProperty('completed');
    expect(result).toHaveProperty('inProgress');
    expect(result).toHaveProperty('overdue');
    expect(result).toHaveProperty('notStarted');
    expect(result).toHaveProperty('pendingAssign');
    expect(result).toHaveProperty('urgent');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('risks');
    expect(result).toHaveProperty('suggestions');
  });

  it('should return hardcoded values for warnings, risks, and suggestions', async () => {
    prisma.task.count.mockResolvedValue(0);

    const result = await service.getSummary();

    expect(result.warnings).toBe(3);
    expect(result.risks).toBe(2);
    expect(result.suggestions).toBe(4);
  });

  it('should call prisma.task.count with correct where clauses', async () => {
    prisma.task.count.mockResolvedValue(0);

    await service.getSummary();

    expect(prisma.task.count).toHaveBeenCalledWith({});
    expect(prisma.task.count).toHaveBeenCalledWith({ where: { status: 'completed' } });
    expect(prisma.task.count).toHaveBeenCalledWith({ where: { status: 'in_progress' } });
    expect(prisma.task.count).toHaveBeenCalledWith({ where: { status: 'overdue' } });
    expect(prisma.task.count).toHaveBeenCalledWith({ where: { status: 'not_started' } });
    expect(prisma.task.count).toHaveBeenCalledWith({ where: { status: 'pending_assign' } });
    expect(prisma.task.count).toHaveBeenCalledWith({ where: { priority: 'urgent' } });
    expect(prisma.task.count).toHaveBeenCalledTimes(7);
  });
});
