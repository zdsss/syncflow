import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock localStorage before importing the hook
vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

import { useSocket } from '../useSocket';

// Track mock STOMP client instance
let stompClientInstance: any = null;
let connectCallback: (() => void) | null = null;
let disconnectCallback: (() => void) | null = null;
let stompErrorCallback: ((frame: any) => void) | null = null;

const mockSubscriptions = new Map<string, { unsubscribe: ReturnType<typeof vi.fn>; handler: (msg: any) => void }>();

vi.mock('@stomp/stompjs', () => {
  const MockClient = function(this: any, config: any) {
    this.activate = vi.fn();
    this.deactivate = vi.fn();
    this.connected = false;
    this.subscribe = vi.fn((destination: string, handler: (msg: any) => void) => {
      const sub = { unsubscribe: vi.fn() };
      mockSubscriptions.set(destination, { ...sub, handler });
      return sub;
    });

    stompClientInstance = this;

    connectCallback = () => {
      this.connected = true;
      config.onConnect?.();
    };
    disconnectCallback = () => {
      this.connected = false;
      config.onDisconnect?.();
    };
    stompErrorCallback = config.onStompError ?? null;
  } as any;

  return {
    Client: MockClient,
  };
});

vi.mock('sockjs-client', () => ({
  default: vi.fn(() => ({})),
}));

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stompClientInstance = null;
    connectCallback = null;
    disconnectCallback = null;
    mockSubscriptions.clear();
  });

  it('returns initial state with connected=false', () => {
    const { result } = renderHook(() => useSocket());
    expect(result.current.connected).toBe(false);
  });

  it('activates the STOMP client on mount', () => {
    renderHook(() => useSocket());
    expect(stompClientInstance).not.toBeNull();
    expect(stompClientInstance.activate).toHaveBeenCalled();
  });

  it('sets connected to true when STOMP connects', () => {
    const { result } = renderHook(() => useSocket());
    act(() => { connectCallback?.(); });
    expect(result.current.connected).toBe(true);
  });

  it('sets connected to false when STOMP disconnects', () => {
    const { result } = renderHook(() => useSocket());
    act(() => { connectCallback?.(); });
    expect(result.current.connected).toBe(true);
    act(() => { disconnectCallback?.(); });
    expect(result.current.connected).toBe(false);
  });

  it('sets connected to false on STOMP error', () => {
    const { result } = renderHook(() => useSocket());
    act(() => { connectCallback?.(); });
    expect(result.current.connected).toBe(true);
    act(() => {
      stompErrorCallback?.({ headers: { message: 'Test error' } });
    });
    expect(result.current.connected).toBe(false);
  });

  it('subscribe creates a STOMP subscription and returns cleanup function', () => {
    const { result } = renderHook(() => useSocket());
    act(() => { connectCallback?.(); });

    const handler = vi.fn();
    let cleanup: (() => void) | undefined;

    act(() => {
      cleanup = result.current.subscribe('/topic/test', handler);
    });

    expect(stompClientInstance.subscribe).toHaveBeenCalledWith('/topic/test', expect.any(Function));
    expect(typeof cleanup).toBe('function');

    // Call cleanup
    act(() => { cleanup?.(); });
    const stored = mockSubscriptions.get('/topic/test');
    expect(stored?.unsubscribe).toHaveBeenCalled();
  });

  it('subscribe returns no-op cleanup when client is not connected', () => {
    const { result } = renderHook(() => useSocket());
    const handler = vi.fn();

    let cleanup: (() => void) | undefined;
    act(() => {
      cleanup = result.current.subscribe('/topic/test', handler);
    });

    // Should not call subscribe on the client since it's not connected
    expect(stompClientInstance.subscribe).not.toHaveBeenCalled();
    expect(typeof cleanup).toBe('function');
  });

  it('subscribe parses JSON message body', () => {
    const { result } = renderHook(() => useSocket());
    act(() => { connectCallback?.(); });

    const handler = vi.fn();
    act(() => {
      result.current.subscribe('/topic/test', handler);
    });

    // Simulate receiving a message
    const stored = mockSubscriptions.get('/topic/test');
    act(() => {
      stored?.handler({ body: '{"type":"update","data":"test"}' });
    });

    expect(handler).toHaveBeenCalledWith({ type: 'update', data: 'test' });
  });

  it('subscribe passes raw body when JSON parsing fails', () => {
    const { result } = renderHook(() => useSocket());
    act(() => { connectCallback?.(); });

    const handler = vi.fn();
    act(() => {
      result.current.subscribe('/topic/test', handler);
    });

    const stored = mockSubscriptions.get('/topic/test');
    act(() => {
      stored?.handler({ body: 'plain text' });
    });

    expect(handler).toHaveBeenCalledWith('plain text');
  });

  it('unsubscribe removes a subscription by destination', () => {
    const { result } = renderHook(() => useSocket());
    act(() => { connectCallback?.(); });

    const handler = vi.fn();
    act(() => {
      result.current.subscribe('/topic/test', handler);
    });

    act(() => {
      result.current.unsubscribe('/topic/test');
    });

    const stored = mockSubscriptions.get('/topic/test');
    expect(stored?.unsubscribe).toHaveBeenCalled();
  });

  it('deactivates the STOMP client on unmount', () => {
    const { unmount } = renderHook(() => useSocket());
    unmount();
    expect(stompClientInstance.deactivate).toHaveBeenCalled();
  });
});
