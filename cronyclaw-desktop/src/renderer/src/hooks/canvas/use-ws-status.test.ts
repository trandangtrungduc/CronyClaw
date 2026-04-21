import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWSStatus } from './use-ws-status';

let wsStateValue: string = 'CLOSED';
let reconnectFn = vi.fn();

vi.mock('@/context/websocket-context', () => ({
  useWebSocket: () => ({
    wsState: wsStateValue,
    reconnect: reconnectFn,
  }),
}));

describe('useWSStatus', () => {
  it('returns OPEN status and does not reconnect on click', () => {
    wsStateValue = 'OPEN';
    reconnectFn = vi.fn();

    const { result } = renderHook(() => useWSStatus());
    expect(result.current.color).toBe('green.500');
    expect(result.current.textKey).toBe('wsStatus.connected');
    expect(result.current.isDisconnected).toBe(false);

    act(() => {
      result.current.handleClick();
    });

    expect(reconnectFn).not.toHaveBeenCalled();
  });

  it('returns CONNECTING status and does not reconnect on click', () => {
    wsStateValue = 'CONNECTING';
    reconnectFn = vi.fn();

    const { result } = renderHook(() => useWSStatus());
    expect(result.current.color).toBe('yellow.500');
    expect(result.current.textKey).toBe('wsStatus.connecting');
    expect(result.current.isDisconnected).toBe(false);

    act(() => {
      result.current.handleClick();
    });

    expect(reconnectFn).not.toHaveBeenCalled();
  });

  it('returns CLOSED status and reconnects on click', () => {
    wsStateValue = 'CLOSED';
    reconnectFn = vi.fn();

    const { result } = renderHook(() => useWSStatus());
    expect(result.current.color).toBe('red.500');
    expect(result.current.textKey).toBe('wsStatus.clickToReconnect');
    expect(result.current.isDisconnected).toBe(true);

    act(() => {
      result.current.handleClick();
    });

    expect(reconnectFn).toHaveBeenCalledTimes(1);
  });
});
