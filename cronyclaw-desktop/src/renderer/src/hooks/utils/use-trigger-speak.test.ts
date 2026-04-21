import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTriggerSpeak } from './use-trigger-speak';

vi.mock('@/context/websocket-context', () => ({
  useWebSocket: () => ({
    sendMessage: (...args: any[]) => (globalThis as any).__triggerSpeakSendMessageMock(...args),
  }),
}));

vi.mock('@/hooks/utils/use-media-capture', () => ({
  useMediaCapture: () => ({
    captureAllMedia: (...args: any[]) => (globalThis as any).__triggerSpeakCaptureAllMediaMock(...args),
  }),
}));

describe('useTriggerSpeak', () => {
  beforeEach(() => {
    (globalThis as any).__triggerSpeakSendMessageMock = vi.fn();
    (globalThis as any).__triggerSpeakImagesMock = [
      { source: 'camera', mime_type: 'image/jpeg', data: 'img' },
    ];
    (globalThis as any).__triggerSpeakCaptureAllMediaMock = vi.fn().mockResolvedValue(
      (globalThis as any).__triggerSpeakImagesMock,
    );
  });

  it('captures media and sends ai-speak-signal with idle_time + images', async () => {
    const { result } = renderHook(() => useTriggerSpeak());

    await act(async () => {
      await result.current.sendTriggerSignal(1234);
    });

    expect((globalThis as any).__triggerSpeakCaptureAllMediaMock).toHaveBeenCalledTimes(1);

    expect((globalThis as any).__triggerSpeakSendMessageMock).toHaveBeenCalledWith({
      type: 'ai-speak-signal',
      idle_time: 1234,
      images: (globalThis as any).__triggerSpeakImagesMock,
    });
  });
});
