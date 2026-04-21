import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { CameraProvider, useCamera } from './camera-context';
import { useEffect } from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

function wrap(ui: ReactNode) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <CameraProvider>{ui}</CameraProvider>
    </ChakraProvider>,
  );
}

function CameraConsumer({ exposeStart }: { exposeStart?: (fn: () => Promise<void>) => void }) {
  const {
    isStreaming,
    startCamera,
    stopCamera,
    videoRef,
    cameraConfig,
    setCameraConfig,
  } = useCamera();

  useEffect(() => {
    if (!exposeStart) return;
    exposeStart(startCamera);
  }, [exposeStart, startCamera]);

  return (
    <div>
      <span data-testid="isStreaming">{String(isStreaming)}</span>
      <span data-testid="w">{String(cameraConfig.width)}</span>
      <button
        type="button"
        onClick={() => {
          setCameraConfig({ width: 111, height: 222 });
        }}
      >
        setConfig
      </button>
      <button
        type="button"
        onClick={() => {
          void startCamera();
        }}
      >
        start
      </button>
      <button type="button" onClick={() => stopCamera()}>
        stop
      </button>
      <video ref={videoRef as any} data-testid="video" />
    </div>
  );
}

describe('CameraContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const fakeTrackStop = vi.fn();
    const fakeStream = {
      getTracks: () => [{ stop: fakeTrackStop }],
    } as unknown as MediaStream;

    const enumerateDevices = vi.fn().mockResolvedValue([
      { kind: 'videoinput' } as MediaDeviceInfo,
    ]);
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream);

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: {
        enumerateDevices,
        getUserMedia,
      },
    });
  });

  it('starts and stops camera stream', async () => {
    wrap(<CameraConsumer />);
    expect(screen.getByTestId('isStreaming').textContent).toBe('false');

    await act(async () => {
      fireEvent.click(screen.getByText('start'));
    });
    expect(screen.getByTestId('isStreaming').textContent).toBe('true');

    await act(async () => {
      fireEvent.click(screen.getByText('stop'));
    });
    expect(screen.getByTestId('isStreaming').textContent).toBe('false');
  });

  it('updates camera config via setCameraConfig', () => {
    wrap(<CameraConsumer />);
    expect(screen.getByTestId('w').textContent).toBe('320');
    fireEvent.click(screen.getByText('setConfig'));
    expect(screen.getByTestId('w').textContent).toBe('111');
  });

  it('throws when camera API is missing', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    let startFn: (() => Promise<void>) | null = null;
    wrap(
      <CameraConsumer
        exposeStart={(fn) => {
          startFn = fn;
        }}
      />,
    );
    expect(startFn).not.toBeNull();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(startFn!()).rejects.toThrow();
    } finally {
      errorSpy.mockRestore();
    }
  });
});
