import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: {
    getSummary: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getSummary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: service },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should return 200 with summary data', async () => {
    const mockSummary = {
      totalTasks: 25,
      completed: 5,
      inProgress: 5,
      overdue: 5,
      notStarted: 5,
      pendingAssign: 5,
      urgent: 0,
      warnings: 3,
      risks: 2,
      suggestions: 4,
    };

    service.getSummary.mockResolvedValue(mockSummary);

    const result = await controller.getSummary();

    expect(result).toEqual({
      code: 0,
      data: mockSummary,
    });
    expect(service.getSummary).toHaveBeenCalledTimes(1);
  });
});
