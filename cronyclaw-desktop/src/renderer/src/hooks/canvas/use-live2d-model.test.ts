import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { RefObject } from 'react';
import { useLive2DModel } from './use-live2d-model';

let updateModelConfig: any;
vi.mock('../../../WebSDK/src/lappdefine', () => ({
  updateModelConfig: vi.fn(),
}));

let initializeLive2D: any;
vi.mock('@cubismsdksamples/main', () => ({
  initializeLive2D: vi.fn(),
}));

vi.mock('../../../WebSDK/src/lappdelegate', () => ({
  LAppDelegate: {
    getInstance: () => ({
      getView: () => ({
        _deviceToScreen: {
          transformX: (x: number) => x,
          transformY: (y: number) => y,
        },
      }),
    }),
  },
}));

vi.mock('@/context/mode-context', () => ({
  useMode: () => ({
    mode: 'window',
    setMode: vi.fn(),
    isElectron: false,
  }),
}));

describe('useLive2DModel', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    const lappDefine = await import('../../../WebSDK/src/lappdefine');
    updateModelConfig = lappDefine.updateModelConfig;
    updateModelConfig.mockReset();

    const cubismMain = await import('@cubismsdksamples/main');
    initializeLive2D = cubismMain.initializeLive2D;
    initializeLive2D.mockReset();

    Object.defineProperty(window, 'LAppDefine', {
      configurable: true,
      writable: true,
      value: { CurrentKScale: 1 },
    });
    (window as any).LAppLive2DManager = {
      releaseInstance: vi.fn(),
    };

    const matrix = new Array(16).fill(0);
    matrix[12] = 10;
    matrix[13] = 20;

    const modelMatrix = {
      getArray: () => [...matrix],
      setMatrix: (newMatrix: number[]) => {
        for (let i = 0; i < newMatrix.length; i += 1) matrix[i] = newMatrix[i];
      },
    };

    const model = {
      _modelMatrix: modelMatrix,
      anyhitTest: vi.fn().mockReturnValue('hit'),
      isHitOnModel: vi.fn().mockReturnValue(true),
      _modelSetting: { _json: { FileReferences: { Motions: {} } } },
      startMotion: vi.fn(),
      startRandomMotion: vi.fn(),
      anyhitTestByName: vi.fn(),
      startTapMotion: vi.fn(),
    };

    const adapter = {
      getModel: vi.fn().mockReturnValue(model),
      setModelPosition: vi.fn((x: number, y: number) => {
        matrix[12] = x;
        matrix[13] = y;
      }),
    };

    (window as any).getLAppAdapter = vi.fn().mockReturnValue(adapter);

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    Object.defineProperty(canvas, 'clientWidth', {
      configurable: true,
      value: 100,
    });
    Object.defineProperty(canvas, 'clientHeight', {
      configurable: true,
      value: 100,
    });
    canvas.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
    })) as any;

    canvas.id = 'canvas';
    document.body.innerHTML = '';
    document.body.appendChild(canvas);

    (window as any).__testAdapter = adapter;
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    delete (window as any).getLAppAdapter;
    delete (window as any).LAppLive2DManager;
    delete (window as any).LAppDefine;
    delete (window as any).__testAdapter;
  });

  it('calls updateModelConfig and initializes Live2D after delay', async () => {
    const canvasRef = {
      current: document.getElementById('canvas') as HTMLCanvasElement,
    } as unknown as RefObject<HTMLCanvasElement>;

    const modelInfo = {
      url: 'http://example.com/models/dir/m1.model3.json',
      kScale: 0.5,
      initialXshift: 0,
      initialYshift: 0,
      emotionMap: {},
    };

    renderHook(() => useLive2DModel({ modelInfo, canvasRef }));

    expect(updateModelConfig).toHaveBeenCalledWith(
      'http://example.com/models/',
      'dir',
      'm1',
      0.5,
    );

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    const releaseInstance = (window as any).LAppLive2DManager.releaseInstance;
    expect(releaseInstance).toHaveBeenCalledTimes(1);
    expect(initializeLive2D).toHaveBeenCalledTimes(1);
  });

  it('updates position from adapter model matrix', async () => {
    const canvasRef = {
      current: document.getElementById('canvas') as HTMLCanvasElement,
    } as unknown as RefObject<HTMLCanvasElement>;

    const modelInfo = {
      url: 'http://example.com/models/dir/m1.model3.json',
      kScale: 0.5,
      initialXshift: 0,
      initialYshift: 0,
      emotionMap: {},
    };

    const { result } = renderHook(() => useLive2DModel({ modelInfo, canvasRef }));

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.position).toEqual({ x: 10, y: 20 });
  });

  it('toggles isDragging and updates model position via handlers', async () => {
    const canvasEl = document.getElementById('canvas') as HTMLCanvasElement;
    const canvasRef = {
      current: canvasEl,
    } as unknown as RefObject<HTMLCanvasElement>;

    const modelInfo = {
      url: 'http://example.com/models/dir/m1.model3.json',
      kScale: 0.5,
      initialXshift: 0,
      initialYshift: 0,
      emotionMap: {},
    };

    const { result } = renderHook(() => useLive2DModel({ modelInfo, canvasRef }));

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    const adapter = (window as any).__testAdapter;

    const downEvent = { clientX: 50, clientY: 60 } as any;
    const move1Event = { clientX: 56, clientY: 61 } as any;
    const move2Event = { clientX: 70, clientY: 80 } as any;
    const upEvent = {} as any;

    await act(async () => {
      result.current.handlers.onMouseDown(downEvent);
    });

    await act(async () => {
      result.current.handlers.onMouseMove(move1Event);
    });
    expect(result.current.isDragging).toBe(true);

    await act(async () => {
      result.current.handlers.onMouseMove(move2Event);
    });

    expect(adapter.setModelPosition).toHaveBeenCalled();
    const lastCall = adapter.setModelPosition.mock.calls[adapter.setModelPosition.mock.calls.length - 1];
    expect(lastCall[0]).toBe(50);
    expect(lastCall[1]).toBe(60);
    expect(result.current.position).toEqual({ x: 50, y: 60 });

    await act(async () => {
      result.current.handlers.onMouseUp(upEvent);
    });
    expect(result.current.isDragging).toBe(false);
  });
});
