import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ScreenCaptureProvider, useScreenCaptureContext } from './screen-capture-context';
import { toaster } from '@/components/ui/toaster';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

function Harness({
  exposeStart,
  exposeStop,
}: {
  exposeStart?: (fn: () => Promise<void>) => void;
  exposeStop?: (fn: () => void) => void;
}) {
  const { stream, isStreaming, error, startCapture, stopCapture } = useScreenCaptureContext();

  useEffect(() => {
    if (!exposeStart) return;
    exposeStart(startCapture);
  }, [exposeStart, startCapture]);

  useEffect(() => {
    if (!exposeStop) return;
    exposeStop(stopCapture);
  }, [exposeStop, stopCapture]);

  return (
    <div>
      <span data-testid="isStreaming">{String(isStreaming)}</span>
      <span data-testid="error">{error}</span>
      <span data-testid="hasStream">{stream ? 'yes' : 'no'}</span>
      <button type="button" onClick={() => void startCapture()}>
        start
      </button>
      <button type="button" onClick={() => stopCapture()}>
        stop
      </button>
    </div>
  );
}

function wrap(ui: ReactNode) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <ScreenCaptureProvider>{ui}</ScreenCaptureProvider>
    </ChakraProvider>,
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <div data-testid="caught">{this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

describe('ScreenCaptureContext', () => {
  const originalElectron = (window as any).electron;

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: {
        getDisplayMedia: vi.fn(),
        getUserMedia: vi.fn(),
      },
    });

    Object.defineProperty(window, 'electron', {
      configurable: true,
      writable: true,
      value: originalElectron,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'electron', {
      configurable: true,
      writable: true,
      value: originalElectron,
    });
  });

  it('starts and stops capture in web mode (no electron)', async () => {
    Object.defineProperty(window, 'electron', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    const trackStop = vi.fn();
    const fakeStream = { getTracks: () => [{ stop: trackStop }] } as any;

    const getDisplayMedia = (navigator.mediaDevices as any).getDisplayMedia as any;
    getDisplayMedia.mockResolvedValue(fakeStream);

    let startFn: (() => Promise<void>) | null = null;
    let stopFn: (() => void) | null = null;

    wrap(
      <Harness
        exposeStart={(fn) => {
          startFn = fn;
        }}
        exposeStop={(fn) => {
          stopFn = fn;
        }}
      />,
    );

    expect(startFn).not.toBeNull();
    expect(stopFn).not.toBeNull();

    await act(async () => {
      await startFn!();
    });

    expect(screen.getByTestId('isStreaming').textContent).toBe('true');
    expect(screen.getByTestId('hasStream').textContent).toBe('yes');
    expect(screen.getByTestId('error').textContent).toBe('');

    act(() => {
      stopFn!();
    });

    expect(trackStop).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('isStreaming').textContent).toBe('false');
    expect(screen.getByTestId('hasStream').textContent).toBe('no');
  });

  it('starts capture in electron mode using ipcRenderer and getUserMedia', async () => {
    const trackStop = vi.fn();
    const fakeStream = { getTracks: () => [{ stop: trackStop }] } as any;

    const sourceId = 'source-id';

    const getUserMedia = (navigator.mediaDevices as any).getUserMedia as any;
    getUserMedia.mockResolvedValue(fakeStream);

    (window.electron as any).ipcRenderer.invoke = vi.fn().mockResolvedValue(sourceId);

    let startFn: (() => Promise<void>) | null = null;
    wrap(
      <Harness
        exposeStart={(fn) => {
          startFn = fn;
        }}
      />,
    );

    expect(startFn).not.toBeNull();

    await act(async () => {
      await startFn!();
    });

    expect((window as any).electron.ipcRenderer.invoke).toHaveBeenCalledWith('get-screen-capture');
    expect(getUserMedia).toHaveBeenCalled();
    expect(screen.getByTestId('isStreaming').textContent).toBe('true');
    expect(screen.getByTestId('hasStream').textContent).toBe('yes');
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('sets error and shows toast when startCapture fails', async () => {
    const error = new Error('fail');

    Object.defineProperty(window, 'electron', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    const getDisplayMedia = (navigator.mediaDevices as any).getDisplayMedia as any;
    getDisplayMedia.mockRejectedValue(error);

    let startFn: (() => Promise<void>) | null = null;
    wrap(
      <Harness
        exposeStart={(fn) => {
          startFn = fn;
        }}
      />,
    );

    expect(startFn).not.toBeNull();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      await startFn!();
    });

    expect(screen.getByTestId('isStreaming').textContent).toBe('false');
    expect(screen.getByTestId('hasStream').textContent).toBe('no');
    expect(screen.getByTestId('error').textContent).toBe('error.failedStartScreenCapture');
    expect(toaster.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('error.failedStartScreenCapture'),
        type: 'error',
      }),
    );

    consoleSpy.mockRestore();
  });

  it('throws when useScreenCaptureContext is used outside provider', () => {
    const Broken = () => {
      useScreenCaptureContext();
      return null;
    };

    render(
      <ErrorBoundary>
        <ChakraProvider value={defaultSystem}>
          <Broken />
        </ChakraProvider>
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('caught').textContent).toBe(
      'useScreenCaptureContext must be used within a ScreenCaptureProvider',
    );
  });
});
