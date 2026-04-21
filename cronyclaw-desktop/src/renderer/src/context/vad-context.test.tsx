import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { SubtitleProvider } from './subtitle-context';
import { AiStateProvider } from './ai-state-context';
import { VADProvider, useVAD } from './vad-context';
import { toaster } from '@/components/ui/toaster';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
  }),
}));

const startMock = vi.fn();
const pauseMock = vi.fn();
const destroyMock = vi.fn();
const micVADNewMock = vi.fn();

vi.mock('@ricky0123/vad-web', () => ({
  MicVAD: {
    new: (...args: any[]) => micVADNewMock(...args),
  },
}));

const interruptMock = vi.fn();
vi.mock('@/components/canvas/live2d', () => ({
  useInterrupt: () => ({
    interrupt: interruptMock,
  }),
}));

const sendAudioPartitionMock = vi.fn();
vi.mock('@/hooks/utils/use-send-audio', () => ({
  useSendAudio: () => ({
    sendAudioPartition: sendAudioPartitionMock,
  }),
}));

vi.mock('@/utils/task-queue', () => ({
  audioTaskQueue: {
    clearQueue: vi.fn(),
  },
}));

function wrap(ui: ReactNode) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <SubtitleProvider>
        <AiStateProvider>
          <VADProvider>{ui}</VADProvider>
        </AiStateProvider>
      </SubtitleProvider>
    </ChakraProvider>,
  );
}

function VADConsumer({ expose }: { expose?: (api: ReturnType<typeof useVAD>) => void }) {
  const { micOn, startMic, stopMic } = useVAD();

  useEffect(() => {
    if (!expose) return;
    expose({ micOn, startMic, stopMic } as any);
  }, [expose, micOn, startMic, stopMic]);

  return (
    <div>
      <span data-testid="micOn">{String(micOn)}</span>
    </div>
  );
}

describe('VADContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    startMock.mockReset();
    pauseMock.mockReset();
    destroyMock.mockReset();
    micVADNewMock.mockReset();

    micVADNewMock.mockResolvedValue({
      start: startMock,
      pause: pauseMock,
      destroy: destroyMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('startMic initializes VAD and sets micOn true', async () => {
    let startFn: (() => Promise<void>) | null = null;
    wrap(
      <VADConsumer
        expose={(api) => {
          startFn = api.startMic;
        }}
      />,
    );

    expect(screen.getByTestId('micOn').textContent).toBe('false');

    await act(async () => {
      await startFn!();
    });

    expect(micVADNewMock).toHaveBeenCalledTimes(1);
    expect(startMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('micOn').textContent).toBe('true');
  });

  it('stopMic pauses/destroys and sets micOn false', async () => {
    let startFn: (() => Promise<void>) | null = null;
    let stopFn: (() => void) | null = null;

    wrap(
      <VADConsumer
        expose={(api) => {
          startFn = api.startMic;
          stopFn = api.stopMic;
        }}
      />,
    );

    await act(async () => {
      await startFn!();
    });
    expect(screen.getByTestId('micOn').textContent).toBe('true');

    act(() => {
      stopFn!();
    });

    expect(pauseMock).toHaveBeenCalledTimes(1);
    expect(destroyMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('micOn').textContent).toBe('false');
  });

  it('shows toast on startMic failure', async () => {
    micVADNewMock.mockRejectedValueOnce(new Error('boom'));

    let startFn: (() => Promise<void>) | null = null;
    wrap(
      <VADConsumer
        expose={(api) => {
          startFn = api.startMic;
        }}
      />,
    );

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      await startFn!();
    });

    expect(toaster.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('error.failedStartVAD'),
        type: 'error',
      }),
    );
    expect(screen.getByTestId('micOn').textContent).toBe('false');

    consoleSpy.mockRestore();
  });
});
