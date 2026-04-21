import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSendAudio } from './use-send-audio';

const chunkSize = 4096;

vi.mock('@/context/websocket-context', () => ({
  useWebSocket: () => ({
    sendMessage: (...args: any[]) => (globalThis as any).__sendAudioSendMessageMock(...args),
  }),
}));

vi.mock('@/hooks/utils/use-media-capture', () => ({
  useMediaCapture: () => ({
    captureAllMedia: (...args: any[]) => (globalThis as any).__sendAudioCaptureAllMediaMock(...args),
  }),
}));

describe('useSendAudio', () => {
  beforeEach(() => {
    (globalThis as any).__sendAudioSendMessageMock = vi.fn();
    (globalThis as any).__sendAudioImagesMock = [
      { source: 'screen', data: 'img', mime_type: 'image/jpeg' },
    ];
    (globalThis as any).__sendAudioCaptureAllMediaMock = vi.fn().mockResolvedValue(
      (globalThis as any).__sendAudioImagesMock,
    );
  });

  it('chunks audio and sends mic-audio-end with captured images', async () => {
    const audio = new Float32Array(chunkSize + 10);
    for (let i = 0; i < audio.length; i += 1) audio[i] = i;

    const { result } = renderHook(() => useSendAudio());

    await act(async () => {
      await result.current.sendAudioPartition(audio);
    });

    expect((globalThis as any).__sendAudioSendMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'mic-audio-data',
        audio: Array.from(audio.slice(0, chunkSize)),
      }),
    );

    expect((globalThis as any).__sendAudioSendMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'mic-audio-data',
        audio: Array.from(audio.slice(chunkSize)),
      }),
    );

    expect((globalThis as any).__sendAudioSendMessageMock).toHaveBeenCalledWith({
      type: 'mic-audio-end',
      images: (globalThis as any).__sendAudioImagesMock,
    });
  });
});
