import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLive2dSettings } from './use-live2d-settings';

vi.mock('@/context/live2d-config-context', () => ({
  useLive2DConfig: () => ({
    modelInfo: (globalThis as any).__live2dModelInfo,
    setModelInfo: (globalThis as any).__setLive2dModelInfoMock,
  }),
}));

describe('useLive2dSettings', () => {
  beforeEach(() => {
    (globalThis as any).__live2dModelInfo = {
      url: 'u',
      kScale: 0.5,
      initialXshift: 0,
      initialYshift: 0,
      emotionMap: {},
      pointerInteractive: true,
      scrollToResize: true,
    };
    (globalThis as any).__setLive2dModelInfoMock = vi.fn();
  });

  it('initializes modelInfo from Live2D config and can save/cancel with context updates', async () => {
    const { result } = renderHook(() => useLive2dSettings());

    expect(result.current.modelInfo).toMatchObject({
      url: 'u',
      kScale: 0.5,
      pointerInteractive: true,
      scrollToResize: true,
    });

    act(() => {
      result.current.handleInputChange('pointerInteractive', false);
    });

    expect(result.current.modelInfo.pointerInteractive).toBe(false);

    expect((globalThis as any).__setLive2dModelInfoMock).toHaveBeenCalled();

    act(() => {
      result.current.handleSave();
    });

    act(() => {
      result.current.handleInputChange('pointerInteractive', true);
      result.current.handleInputChange('scrollToResize', false);
    });

    const afterEdits = result.current.modelInfo;
    expect(afterEdits.pointerInteractive).toBe(true);
    expect(afterEdits.scrollToResize).toBe(false);

    act(() => {
      result.current.handleCancel();
    });

    expect(result.current.modelInfo.pointerInteractive).toBe(false);
    expect(result.current.modelInfo.scrollToResize).toBe(true);
    expect((globalThis as any).__setLive2dModelInfoMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pointerInteractive: false,
        scrollToResize: true,
      }),
    );
  });
});
