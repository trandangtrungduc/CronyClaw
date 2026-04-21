import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCameraPanel } from './use-camera-panel';

vi.mock('@/context/camera-context', () => ({
  useCamera: () => ({
    isStreaming: (globalThis as any).__camIsStreaming,
    stream: (globalThis as any).__camStream,
    startCamera: (globalThis as any).__camStartCameraMock,
    stopCamera: (globalThis as any).__camStopCameraMock,
  }),
}));

describe('useCameraPanel', () => {
  beforeEach(() => {
    (globalThis as any).__camIsStreaming = false;
    (globalThis as any).__camStream = null;
    (globalThis as any).__camStartCameraMock = vi.fn();
    (globalThis as any).__camStopCameraMock = vi.fn();
  });

  it('toggleCamera calls startCamera when not streaming and clears error', async () => {
    const { result } = renderHook(() => useCameraPanel());
    expect(result.current.error).toBe('');

    await act(async () => {
      await result.current.toggleCamera();
    });

    expect((globalThis as any).__camStartCameraMock).toHaveBeenCalledTimes(1);
    expect((globalThis as any).__camStopCameraMock).not.toHaveBeenCalled();
    expect(result.current.error).toBe('');
  });

  it('toggleCamera calls stopCamera when streaming', async () => {
    (globalThis as any).__camIsStreaming = true;
    const { result } = renderHook(() => useCameraPanel());

    await act(async () => {
      await result.current.toggleCamera();
    });

    expect((globalThis as any).__camStopCameraMock).toHaveBeenCalledTimes(1);
    expect((globalThis as any).__camStartCameraMock).not.toHaveBeenCalled();
    expect(result.current.error).toBe('');
  });

  it('sets error message when startCamera fails', async () => {
    const err = new Error('Camera blocked');
    (globalThis as any).__camStartCameraMock = vi.fn().mockRejectedValue(err);

    const { result } = renderHook(() => useCameraPanel());

    await act(async () => {
      await result.current.toggleCamera();
    });

    expect(result.current.error).toBe('Camera blocked');
  });

  it('updates isHovering via mouse enter/leave handlers', async () => {
    const { result } = renderHook(() => useCameraPanel());
    expect(result.current.isHovering).toBe(false);

    act(() => {
      result.current.handleMouseEnter();
    });
    expect(result.current.isHovering).toBe(true);

    act(() => {
      result.current.handleMouseLeave();
    });
    expect(result.current.isHovering).toBe(false);
  });
});
