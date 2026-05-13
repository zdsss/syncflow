import { useState, useCallback } from 'react';
import { message } from 'antd';

interface UseAsyncDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Reusable hook for data fetching with loading/error state management.
 * Eliminates the duplicate fetch/loading/error boilerplate repeated across page files.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  errorMessage = '加载失败',
): UseAsyncDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err as Error);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetcher, errorMessage]);

  return { data, loading, error, refresh, setData };
}

interface UseAsyncActionOptions {
  errorMessage?: string;
  successMessage?: string;
}

interface UseAsyncActionReturn<TArgs extends any[], TResult> {
  execute: (...args: TArgs) => Promise<TResult | undefined>;
  loading: boolean;
}

/**
 * Reusable hook for mutation operations (create/update/delete).
 * Wraps an async action with loading state and toast messages.
 */
export function useAsyncAction<TArgs extends any[] = any[], TResult = void>(
  action: (...args: TArgs) => Promise<TResult>,
  options: UseAsyncActionOptions = {},
): UseAsyncActionReturn<TArgs, TResult> {
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      setLoading(true);
      try {
        const result = await action(...args);
        if (options.successMessage) message.success(options.successMessage);
        return result;
      } catch {
        message.error(options.errorMessage || '操作失败');
      } finally {
        setLoading(false);
      }
    },
    [action, options.errorMessage, options.successMessage],
  );

  return { execute, loading };
}
