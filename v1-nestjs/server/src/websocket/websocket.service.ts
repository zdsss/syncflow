import { Injectable } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';

@Injectable()
export class WebSocketService {
  constructor(private readonly gateway: WebSocketGateway) {}

  emitTaskStatusChanged(taskId: string, status: string, assigneeId?: string) {
    this.gateway.emit('task:status-changed', { taskId, status, assigneeId });
  }

  emitTaskAssigned(taskId: string, assigneeId: string) {
    this.gateway.emit('task:assigned', { taskId, assigneeId });
  }

  emitNotification(userId: string, notification: { title: string; desc: string; type: string }) {
    this.gateway.emit('notification:new', { userId, ...notification });
  }

  emitApprovalUpdated(approvalId: string, status: string) {
    this.gateway.emit('approval:updated', { approvalId, status });
  }
}
