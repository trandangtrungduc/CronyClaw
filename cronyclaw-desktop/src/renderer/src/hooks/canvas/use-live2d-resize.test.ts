import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RefObject } from 'react';
import React, { useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import { useLive2DResize } from './use-live2d-resize';

const getOnResizeSpy = () => (globalThis as any).__onResizeSpy as ReturnType<typeof vi.fn>;
const getScaleSpy = () => (globalThis as any).__scaleSpy as ReturnType<typeof vi.fn>;

vi.mock('@/context/mode-context', () => ({
  useMode: () => ({
    mode: (globalThis as any).__modeValue ?? 'window',
    setMode: vi.fn(),
    isElectron: false,
  }),
}));

vi.mock('../../../WebSDK/src/lappdelegate', () => {
  const onResizeSpy = vi.fn();
  const getInstanceDelegateSpy = vi.fn().mockReturnValue({ onResize: onResizeSpy });
  (globalThis as any).__onResizeSpy = onResizeSpy;
  return {
    LAppDelegate: {
      getInstance: getInstanceDelegateSpy,
    },
  };
});

vi.mock('../../../WebSDK/src/lapplive2dmanager', () => {
  const scaleSpy = vi.fn();
  const getModelSpy = vi.fn().mockReturnValue({ _modelMatrix: { scale: scaleSpy } });
  const getInstanceManagerSpy = vi.fn().mockReturnValue({ getModel: getModelSpy });
  (globalThis as any).__scaleSpy = scaleSpy;
  return {
    LAppLive2DManager: {
      getInstance: getInstanceManagerSpy,
    },
  };
});

type ModelInfoForTest = {
  url?: string;
  kScale?: number;
  scrollToResize?: boolean;
  initialXshift?: number;
  initialYshift?: number;
} & Record<string, unknown>;

function Host({
  containerRef,
  modelInfo,
  showSidebar,
  expose,
}: {
  containerRef: RefObject<HTMLDivElement>;
  modelInfo: ModelInfoForTest | undefined;
  showSidebar?: boolean;
  expose: (api: { handleResize: () => void }) => void;
}) {
  const { canvasRef, handleResize } = useLive2DResize({ containerRef, modelInfo: modelInfo as any, showSidebar });

  useEffect(() => {
    expose({ handleResize });
  }, [handleResize, expose]);

  return React.createElement(
    'div',
    null,
    React.createElement('div', { ref: containerRef, 'data-testid': 'container' }),
    React.createElement('canvas', { ref: canvasRef, 'data-testid': 'canvas' }),
  );
}

describe('useLive2DResize', () => {
  const originalRAF = global.requestAnimationFrame;
  const originalCancelRAF = global.cancelAnimationFrame;
  const originalResizeObserver = global.ResizeObserver;

  beforeEach(() => {
    getOnResizeSpy().mockReset();
    getScaleSpy().mockReset();
    vi.useFakeTimers();

    global.ResizeObserver = class ResizeObserverMock {
      observe() {}

      disconnect() {}
    } as any;

    global.requestAnimationFrame = ((_cb: FrameRequestCallback) => 0) as any;
    global.cancelAnimationFrame = (() => {}) as any;

    (globalThis as any).__modeValue = 'window';
  });

  afterEach(() => {
    vi.useRealTimers();
    global.requestAnimationFrame = originalRAF as any;
    global.cancelAnimationFrame = originalCancelRAF as any;
    global.ResizeObserver = originalResizeObserver as any;
  });

  it('handleResize updates canvas dimensions and calls delegate.onResize', () => {
    const containerRef = { current: null } as any;
    let handleResize: (() => void) | null = null;

    const modelInfo = {
      url: 'u',
      kScale: 1,
      scrollToResize: true,
      initialXshift: 0,
      initialYshift: 0,
    };

    render(
      React.createElement(Host, {
        containerRef,
        modelInfo,
        showSidebar: false,
        expose: ({ handleResize: exposed }: { handleResize: () => void }) => {
          handleResize = exposed;
        },
      }),
    );

    const containerEl = screen.getByTestId('container');
    containerEl.getBoundingClientRect = vi.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    })) as any;

    const canvasEl = screen.getByTestId('canvas') as HTMLCanvasElement;
    canvasEl.width = 1;
    canvasEl.height = 1;

    Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });

    expect(handleResize).not.toBeNull();

    act(() => {
      handleResize!();
    });

    expect(getOnResizeSpy()).toHaveBeenCalledTimes(1);
    expect(canvasEl.width).toBe(1600);
    expect(canvasEl.height).toBe(1200);
    expect(canvasEl.style.width).toBe('800px');
    expect(canvasEl.style.height).toBe('600px');
  });

  it('wheel scaling triggers applyScale via matrix scaling', () => {
    let rafCount = 0;
    global.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      rafCount += 1;
      if (rafCount <= 10) cb(0);
      return rafCount;
    }) as any;

    const containerRef = { current: null } as any;
    let handleResize: (() => void) | null = null;

    const modelInfo = {
      url: 'u',
      kScale: 1,
      scrollToResize: true,
      initialXshift: 0,
      initialYshift: 0,
    };

    render(
      React.createElement(Host, {
        containerRef,
        modelInfo,
        showSidebar: false,
        expose: ({ handleResize: exposed }: { handleResize: () => void }) => {
          handleResize = exposed;
        },
      }),
    );

    const containerEl = screen.getByTestId('container');
    containerEl.getBoundingClientRect = vi.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    })) as any;

    const canvasEl = screen.getByTestId('canvas') as HTMLCanvasElement;
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true });
    act(() => {
      canvasEl.dispatchEvent(new WheelEvent('wheel', { deltaY: 10, bubbles: true, cancelable: true }));
    });

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(getScaleSpy()).toHaveBeenCalled();
    const firstScale = getScaleSpy().mock.calls[0][0] as number;
    expect(firstScale).toBeGreaterThan(0.97);
    expect(firstScale).toBeLessThanOrEqual(1);

    act(() => {
      handleResize?.();
    });
  });
});
