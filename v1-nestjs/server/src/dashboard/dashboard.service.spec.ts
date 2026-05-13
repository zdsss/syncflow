import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    task: {
      count: jest.Mock;
    };
    project: {
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      task: {
        count: jest.fn(),
      },
      project: {
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
      .mockResolvedValueOnce(0)   // urgent
      .mockResolvedValueOnce(2)   // atRisk (risks)
      .mockResolvedValueOnce(1)   // unassignedTasks
      .mockResolvedValueOnce(2);  // stalledTasks
    prisma.project.count.mockResolvedValueOnce(1); // delayedProjects

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
    prisma.project.count.mockResolvedValue(0);

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

  it('should return dynamic values for warnings, risks, and suggestions', async () => {
    prisma.task.count
      .mockResolvedValueOnce(10)  // totalTasks
      .mockResolvedValueOnce(3)   // completed
      .mockResolvedValueOnce(4)   // inProgress
      .mockResolvedValueOnce(5)   // overdue
      .mockResolvedValueOnce(2)   // notStarted
      .mockResolvedValueOnce(1)   // pendingAssign
      .mockResolvedValueOnce(0)   // urgent
      .mockResolvedValueOnce(2)   // atRisk (risks)
      .mockResolvedValueOnce(1)   // unassignedTasks
      .mockResolvedValueOnce(2);  // stalledTasks
    prisma.project.count.mockResolvedValueOnce(1); // delayedProjects

    const result = await service.getSummary();

    // warnings = overdue (5) + delayedProjects (1) = 6
    expect(result.warnings).toBe(6);
    // risks = atRisk (2)
    expect(result.risks).toBe(2);
    // suggestions = unassignedTasks (1) + stalledTasks (2) = 3
    expect(result.suggestions).toBe(3);
  });

  it('should call prisma.task.count with correct where clauses', async () => {
    prisma.task.count.mockResolvedValue(0);
    prisma.project.count.mockResolvedValue(0);

    await service.getSummary();

    expect(prisma.task.count).toHaveBeenCalledWith({});
    expect(prisma.task.count).toHaveBeenCalledWith({ where: { status: 'COMPLETED' } });
    expect(prisma.task.count).toHaveBeenCalledWith({ where: { status: 'IN_PROGRESS' } });
    expect(prisma.task.count).toHaveBeenCalledWith({ where: { status: 'OVERDUE' } });
    expect(prisma.task.count).toHaveBeenCalledWith({ where: { status: 'NOT_STARTED' } });
    expect(prisma.task.count).toHaveBeenCalledWith({ where: { status: 'PENDING_ASSIGN' } });
    expect(prisma.task.count).toHaveBeenCalledWith({ where: { priority: 'URGENT' } });
    // New dynamic queries
    expect(prisma.task.count).toHaveBeenCalledWith({
      where: { progress: { lt: 50 }, planEnd: { lt: expect.any(Date), gt: expect.any(Date) } },
    });
    expect(prisma.task.count).toHaveBeenCalledWith({
      where: { assigneeId: '' },
    });
    expect(prisma.task.count).toHaveBeenCalledWith({
      where: { progress: 0, planStart: { lt: expect.any(Date) } },
    });
    expect(prisma.task.count).toHaveBeenCalledTimes(10);
  });

  it('should call prisma.project.count for delayed projects', async () => {
    prisma.task.count.mockResolvedValue(0);
    prisma.project.count.mockResolvedValue(0);

    await service.getSummary();

    expect(prisma.project.count).toHaveBeenCalledWith({
      where: { status: 'DELAYED' },
    });
    expect(prisma.project.count).toHaveBeenCalledTimes(1);
  });
});
