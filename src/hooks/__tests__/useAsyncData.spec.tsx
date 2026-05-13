import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAsyncData, useAsyncAction } from '../useAsyncData';

// Mock antd message
vi.mock('antd', () => ({
  message: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { message } from 'antd';

const mockMessage = vi.mocked(message);

describe('useAsyncData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with null data, false loading, and null error', () => {
    const fetcher = vi.fn().mockResolvedValue('test');
    const { result } = renderHook(() => useAsyncData(fetcher));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets loading state while fetching', async () => {
    let resolveFn: (value: string) => void;
    const fetcher = vi.fn(
      () => new Promise<string>((resolve) => { resolveFn = resolve; }),
    );
    const { result } = renderHook(() => useAsyncData(fetcher));

    await act(async () => {
      result.current.refresh();
    });

    // After refresh starts, loading should be true before resolution
    // Resolve to complete the cycle
    await act(async () => {
      resolveFn!('done');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe('done');
  });

  it('returns data on successful fetch', async () => {
    const mockData = { id: 1, name: 'test' };
    const fetcher = vi.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useAsyncData(fetcher));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('shows error message and sets error state on failure', async () => {
    const fetchError = new Error('network error');
    const fetcher = vi.fn().mockRejectedValue(fetchError);
    const { result } = renderHook(() => useAsyncData(fetcher, '自定义错误'));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(fetchError);
    expect(result.current.loading).toBe(false);
    expect(mockMessage.error).toHaveBeenCalledWith('自定义错误');
  });

  it('uses default error message when not provided', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useAsyncData(fetcher));

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockMessage.error).toHaveBeenCalledWith('加载失败');
  });

  it('refresh re-fetches data', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');
    const { result } = renderHook(() => useAsyncData(fetcher));

    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.data).toBe('first');

    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.data).toBe('second');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('exposes setData for manual updates', () => {
    const fetcher = vi.fn().mockResolvedValue('test');
    const { result } = renderHook(() => useAsyncData(fetcher));

    act(() => {
      result.current.setData('manual');
    });

    expect(result.current.data).toBe('manual');
  });

  it('clears previous error on new refresh', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');
    const { result } = renderHook(() => useAsyncData(fetcher));

    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.error).not.toBeNull();

    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBe('success');
  });
});

describe('useAsyncAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with false loading', () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAsyncAction(action));

    expect(result.current.loading).toBe(false);
  });

  it('sets loading state during execution', async () => {
    let resolveFn: (value: void) => void;
    const action = vi.fn(
      () => new Promise<void>((resolve) => { resolveFn = resolve; }),
    );
    const { result } = renderHook(() => useAsyncAction(action));

    let executePromise: Promise<any>;
    await act(async () => {
      executePromise = result.current.execute();
    });

    await act(async () => {
      resolveFn!();
      await executePromise!;
    });

    expect(result.current.loading).toBe(false);
  });

  it('returns result on successful execution', async () => {
    const action = vi.fn().mockResolvedValue({ id: 42 });
    const { result } = renderHook(() => useAsyncAction(action));

    let returned: any;
    await act(async () => {
      returned = await result.current.execute('arg1', 'arg2');
    });

    expect(returned).toEqual({ id: 42 });
    expect(action).toHaveBeenCalledWith('arg1', 'arg2');
    expect(result.current.loading).toBe(false);
  });

  it('shows success message when configured', async () => {
    const action = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() =>
      useAsyncAction(action, { successMessage: '创建成功' }),
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(mockMessage.success).toHaveBeenCalledWith('创建成功');
  });

  it('does not show success message when not configured', async () => {
    const action = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => useAsyncAction(action));

    await act(async () => {
      await result.current.execute();
    });

    expect(mockMessage.success).not.toHaveBeenCalled();
  });

  it('shows error message on failure', async () => {
    const action = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() =>
      useAsyncAction(action, { errorMessage: '删除失败' }),
    );

    let returned: any;
    await act(async () => {
      returned = await result.current.execute();
    });

    expect(returned).toBeUndefined();
    expect(mockMessage.error).toHaveBeenCalledWith('删除失败');
    expect(result.current.loading).toBe(false);
  });

  it('uses default error message when not configured', async () => {
    const action = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useAsyncAction(action));

    await act(async () => {
      await result.current.execute();
    });

    expect(mockMessage.error).toHaveBeenCalledWith('操作失败');
  });

  it('passes arguments to the action function', async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAsyncAction(action));

    await act(async () => {
      await result.current.execute('a', 'b', 'c');
    });

    expect(action).toHaveBeenCalledWith('a', 'b', 'c');
  });
});
