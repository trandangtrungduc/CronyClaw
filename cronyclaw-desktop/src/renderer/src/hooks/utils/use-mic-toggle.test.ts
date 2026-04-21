import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMicToggle } from './use-mic-toggle';

vi.mock('@/context/vad-context', () => ({
  useVAD: () => ({
    startMic: (...args: any[]) => (globalThis as any).__micStartMock(...args),
    stopMic: (...args: any[]) => (globalThis as any).__micStopMock(...args),
    micOn: (globalThis as any).__micOnValue,
  }),
}));

vi.mock('@/context/ai-state-context', () => ({
  useAiState: () => ({
    aiState: (globalThis as any).__micAiStateValue,
    setAiState: (...args: any[]) => (globalThis as any).__micSetAiStateMock(...args),
  }),
}));

describe('useMicToggle', () => {
  beforeEach(() => {
    (globalThis as any).__micOnValue = false;
    (globalThis as any).__micAiStateValue = 'idle';
    (globalThis as any).__micStartMock = vi.fn().mockResolvedValue(undefined);
    (globalThis as any).__micStopMock = vi.fn();
    (globalThis as any).__micSetAiStateMock = vi.fn();
  });

  it('starts mic when micOn is false', async () => {
    const { result } = renderHook(() => useMicToggle());

    await act(async () => {
      await result.current.handleMicToggle();
    });

    expect((globalThis as any).__micStartMock).toHaveBeenCalledTimes(1);
    expect((globalThis as any).__micStopMock).not.toHaveBeenCalled();
    expect((globalThis as any).__micSetAiStateMock).not.toHaveBeenCalled();
  });

  it('stops mic and sets aiState to idle when micOn is true and aiState is listening', async () => {
    (globalThis as any).__micOnValue = true;
    (globalThis as any).__micAiStateValue = 'listening';

    const { result } = renderHook(() => useMicToggle());

    await act(async () => {
      await result.current.handleMicToggle();
    });

    expect((globalThis as any).__micStopMock).toHaveBeenCalledTimes(1);
    expect((globalThis as any).__micStartMock).not.toHaveBeenCalled();
    expect((globalThis as any).__micSetAiStateMock).toHaveBeenCalledWith('idle');
  });

  it('stops mic without changing aiState when aiState is not listening', async () => {
    (globalThis as any).__micOnValue = true;
    (globalThis as any).__micAiStateValue = 'idle';

    const { result } = renderHook(() => useMicToggle());

    await act(async () => {
      await result.current.handleMicToggle();
    });

    expect((globalThis as any).__micStopMock).toHaveBeenCalledTimes(1);
    expect((globalThis as any).__micSetAiStateMock).not.toHaveBeenCalled();
  });
});
