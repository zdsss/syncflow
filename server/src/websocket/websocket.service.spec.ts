import { Test, TestingModule } from '@nestjs/testing';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';

describe('WebSocketService', () => {
  let service: WebSocketService;
  let gateway: WebSocketGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebSocketService,
        {
          provide: WebSocketGateway,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WebSocketService>(WebSocketService);
    gateway = module.get<WebSocketGateway>(WebSocketGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('emitTaskStatusChanged', () => {
    it('should emit task:status-changed event', () => {
      service.emitTaskStatusChanged('task-1', 'completed', 'user-1');

      expect(gateway.emit).toHaveBeenCalledWith('task:status-changed', {
        taskId: 'task-1',
        status: 'completed',
        assigneeId: 'user-1',
      });
    });

    it('should emit task:status-changed without assigneeId', () => {
      service.emitTaskStatusChanged('task-1', 'in_progress');

      expect(gateway.emit).toHaveBeenCalledWith('task:status-changed', {
        taskId: 'task-1',
        status: 'in_progress',
        assigneeId: undefined,
      });
    });
  });

  describe('emitTaskAssigned', () => {
    it('should emit task:assigned event', () => {
      service.emitTaskAssigned('task-1', 'user-2');

      expect(gateway.emit).toHaveBeenCalledWith('task:assigned', {
        taskId: 'task-1',
        assigneeId: 'user-2',
      });
    });
  });

  describe('emitNotification', () => {
    it('should emit notification:new event', () => {
      service.emitNotification('user-1', {
        title: 'Task assigned',
        desc: 'You have a new task',
        type: 'task',
      });

      expect(gateway.emit).toHaveBeenCalledWith('notification:new', {
        userId: 'user-1',
        title: 'Task assigned',
        desc: 'You have a new task',
        type: 'task',
      });
    });
  });

  describe('emitApprovalUpdated', () => {
    it('should emit approval:updated event', () => {
      service.emitApprovalUpdated('approval-1', 'approved');

      expect(gateway.emit).toHaveBeenCalledWith('approval:updated', {
        approvalId: 'approval-1',
        status: 'approved',
      });
    });
  });
});
