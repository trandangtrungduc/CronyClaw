import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Live2D } from './live2d';

const handlers = {
  onMouseDown: vi.fn(),
  onMouseMove: vi.fn(),
  onMouseUp: vi.fn(),
  onMouseLeave: vi.fn(),
};

const canvasRef = { current: null as HTMLCanvasElement | null };

const live2dTest = vi.hoisted(() => ({
  forceIgnoreMouse: false,
}));

vi.mock('@/hooks/utils/use-force-ignore-mouse', () => ({
  useForceIgnoreMouse: () => ({ forceIgnoreMouse: live2dTest.forceIgnoreMouse }),
}));

vi.mock('@/context/live2d-config-context', () => ({
  useLive2DConfig: vi.fn(() => ({ modelInfo: { model: 'm' } })),
}));

const mockUseMode = vi.fn(() => ({ mode: 'window' as const }));

vi.mock('@/context/mode-context', () => ({
  useMode: () => mockUseMode(),
}));

vi.mock('@/context/ai-state-context', () => ({
  useAiState: vi.fn(() => ({ aiState: 'loading' })),
  AiStateEnum: {
    IDLE: 'idle',
    LOADING: 'loading',
    LISTENING: 'listening',
    THINKING_SPEAKING: 'thinking-speaking',
    WAITING: 'waiting',
    INTERRUPTED: 'interrupted',
  },
}));

vi.mock('@/hooks/canvas/use-live2d-expression', () => ({
  useLive2DExpression: vi.fn(() => ({ resetExpression: vi.fn() })),
}));

vi.mock('@/hooks/canvas/use-live2d-resize', () => ({
  useLive2DResize: vi.fn(() => ({ canvasRef })),
}));

vi.mock('@/hooks/canvas/use-live2d-model', () => ({
  useLive2DModel: vi.fn(() => ({
    position: { x: 0, y: 0 },
    isDragging: false,
    handlers,
  })),
}));

vi.mock('@/hooks/utils/use-ipc-handlers', () => ({
  useIpcHandlers: vi.fn(),
}));

vi.mock('@/hooks/utils/use-interrupt', () => ({
  useInterrupt: vi.fn(),
}));

vi.mock('@/hooks/utils/use-audio-task', () => ({
  useAudioTask: vi.fn(),
}));

describe('Live2D', () => {
  const showContextMenu = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    live2dTest.forceIgnoreMouse = false;
    mockUseMode.mockImplementation(() => ({ mode: 'window' }));
    (window as unknown as { api?: { showContextMenu?: () => void } }).api = {
      showContextMenu,
    };
  });

  afterEach(() => {
    delete (window as unknown as { api?: unknown }).api;
  });

  function wrap(ui: ReactNode) {
    return render(ui);
  }

  it('renders wrapper and canvas', () => {
    wrap(<Live2D />);
    expect(document.getElementById('live2d-internal-wrapper')).not.toBeNull();
    expect(document.getElementById('canvas')).not.toBeNull();
  });

  it('calls model onMouseDown when pointer down', () => {
    wrap(<Live2D />);
    const el = document.getElementById('live2d-internal-wrapper')!;
    fireEvent.pointerDown(el);
    expect(handlers.onMouseDown).toHaveBeenCalled();
  });

  it('does not call showContextMenu in window mode', () => {
    wrap(<Live2D />);
    const el = document.getElementById('live2d-internal-wrapper')!;
    fireEvent.contextMenu(el);
    expect(showContextMenu).not.toHaveBeenCalled();
  });

  it('calls showContextMenu in pet mode on context menu', () => {
    mockUseMode.mockImplementation(() => ({ mode: 'pet' }));
    wrap(<Live2D />);
    const el = document.getElementById('live2d-internal-wrapper')!;
    fireEvent.contextMenu(el);
    expect(showContextMenu).toHaveBeenCalledTimes(1);
  });

  it('sets pointer-events none on pet wrapper when force ignoring mouse', () => {
    live2dTest.forceIgnoreMouse = true;
    mockUseMode.mockImplementation(() => ({ mode: 'pet' }));
    wrap(<Live2D />);
    const el = document.getElementById('live2d-internal-wrapper')!;
    expect(el).toHaveStyle({ pointerEvents: 'none' });
  });
});
