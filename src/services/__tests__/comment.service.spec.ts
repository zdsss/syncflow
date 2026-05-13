import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import api from '../api';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '../comment.service';

describe('CommentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /tasks/:id/comments', async () => {
    await getComments('task-1');
    expect(api.get).toHaveBeenCalledWith('/tasks/task-1/comments', { params: undefined });
  });

  it('calls GET /tasks/:id/comments with pagination', async () => {
    await getComments('task-1', { pageNum: 2 });
    expect(api.get).toHaveBeenCalledWith('/tasks/task-1/comments', { params: { pageNum: 2 } });
  });

  it('calls POST /tasks/:id/comments with content', async () => {
    await createComment('task-1', { content: 'Looks good' });
    expect(api.post).toHaveBeenCalledWith('/tasks/task-1/comments', { content: 'Looks good' });
  });

  it('calls POST /tasks/:id/comments with parentId', async () => {
    await createComment('task-1', { content: 'Reply', parentId: 'c-1' });
    expect(api.post).toHaveBeenCalledWith('/tasks/task-1/comments', { content: 'Reply', parentId: 'c-1' });
  });

  it('calls PATCH /tasks/:id/comments/:commentId', async () => {
    await updateComment('task-1', 'c-1', { content: 'Updated content' });
    expect(api.patch).toHaveBeenCalledWith('/tasks/task-1/comments/c-1', { content: 'Updated content' });
  });

  it('calls DELETE /tasks/:id/comments/:commentId', async () => {
    await deleteComment('task-1', 'c-1');
    expect(api.delete).toHaveBeenCalledWith('/tasks/task-1/comments/c-1');
  });
});
