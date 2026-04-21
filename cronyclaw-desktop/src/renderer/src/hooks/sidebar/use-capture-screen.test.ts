import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import { useCaptureScreen } from './use-capture-screen';

vi.mock('@/context/screen-capture-context', () => ({
  useScreenCaptureContext: () => ({
    stream: (globalThis as any).__captureStream,
    isStreaming: (globalThis as any).__captureIsStreaming,
    error: (globalThis as any).__captureError,
    startCapture: (globalThis as any).__captureStartMock,
    stopCapture: (globalThis as any).__captureStopMock,
  }),
}));

describe('useCaptureScreen', () => {
  beforeEach(() => {
    (globalThis as any).__captureStream = { id: 's1' };
    (globalThis as any).__captureIsStreaming = false;
    (globalThis as any).__captureError = '';
    (globalThis as any).__captureStartMock = vi.fn().mockResolvedValue(undefined);
    (globalThis as any).__captureStopMock = vi.fn();
  });

  it('toggleCapture calls startCapture when not streaming', () => {
    let api: any;

    const Host = () => {
      api = useCaptureScreen();
      return React.createElement('video', { ref: api.videoRef });
    };

    render(React.createElement(Host));

    act(() => {
      api.toggleCapture();
    });

    expect((globalThis as any).__captureStartMock).toHaveBeenCalledTimes(1);
    expect((globalThis as any).__captureStopMock).not.toHaveBeenCalled();
  });

  it('toggleCapture calls stopCapture when streaming', () => {
    (globalThis as any).__captureIsStreaming = true;

    let api: any;

    const Host = () => {
      api = useCaptureScreen();
      return React.createElement('video', { ref: api.videoRef });
    };

    render(React.createElement(Host));

    act(() => {
      api.toggleCapture();
    });

    expect((globalThis as any).__captureStopMock).toHaveBeenCalledTimes(1);
    expect((globalThis as any).__captureStartMock).not.toHaveBeenCalled();
  });

  it('sets video srcObject to current stream', async () => {
    let api: any;

    const Host = () => {
      api = useCaptureScreen();
      return React.createElement('video', { ref: api.videoRef, 'data-testid': 'v' });
    };

    const { rerender } = render(React.createElement(Host));

    const v = screen.getByTestId('v') as HTMLVideoElement;
    await waitFor(() => {
      expect(v.srcObject).toBe((globalThis as any).__captureStream);
    });

    (globalThis as any).__captureStream = { id: 's2' };
    await act(async () => {
      rerender(React.createElement(Host));
    });

    await waitFor(() => {
      expect(v.srcObject).toBe((globalThis as any).__captureStream);
    });
  });

  it('updates isHovering via mouse enter/leave handlers', () => {
    let api: any;

    const Host = () => {
      api = useCaptureScreen();
      return React.createElement(
        'div',
        null,
        React.createElement('span', { 'data-testid': 'hover' }, String(api.isHovering)),
        React.createElement('video', { ref: api.videoRef }),
      );
    };

    render(React.createElement(Host));

    expect(screen.getByTestId('hover').textContent).toBe('false');

    act(() => {
      api.handleMouseEnter();
    });
    expect(screen.getByTestId('hover').textContent).toBe('true');

    act(() => {
      api.handleMouseLeave();
    });
    expect(screen.getByTestId('hover').textContent).toBe('false');
  });
});
