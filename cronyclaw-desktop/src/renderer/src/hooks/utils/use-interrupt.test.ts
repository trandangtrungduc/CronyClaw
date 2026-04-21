import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInterrupt } from './use-interrupt';

let aiStateValue = 'idle';
let fullResponseValue = 'full-response';
let subtitleTextValue = 'Thinking...';

let stopCurrentAudioAndLipSyncMock = vi.fn();
let sendMessageMock = vi.fn();
let clearResponseMock = vi.fn();
let setAiStateMock = vi.fn();
let setSubtitleTextMock = vi.fn();
let clearQueueMock = vi.fn();

vi.mock('@/context/ai-state-context', () => ({
  useAiState: () => ({
    aiState: (globalThis as any).__interruptAiStateValue,
    setAiState: (globalThis as any).__interruptSetAiStateMock,
  }),
}));

vi.mock('@/context/websocket-context', () => ({
  useWebSocket: () => ({
    sendMessage: (globalThis as any).__interruptSendMessageMock,
  }),
}));

vi.mock('@/context/chat-history-context', () => ({
  useChatHistory: () => ({
    fullResponse: (globalThis as any).__interruptFullResponseValue,
    clearResponse: (globalThis as any).__interruptClearResponseMock,
  }),
}));

vi.mock('@/context/subtitle-context', () => ({
  useSubtitle: () => ({
    subtitleText: (globalThis as any).__interruptSubtitleTextValue,
    setSubtitleText: (globalThis as any).__interruptSetSubtitleTextMock,
  }),
}));

vi.mock('@/utils/task-queue', () => ({
  audioTaskQueue: {
    clearQueue: (...args: any[]) => (globalThis as any).__interruptClearQueueMock(...args),
  },
}));

vi.mock('./use-audio-task', () => ({
  useAudioTask: () => ({
    stopCurrentAudioAndLipSync: (globalThis as any).__interruptStopCurrentAudioAndLipSyncMock,
  }),
}));

describe('useInterrupt', () => {
  it('does nothing when aiState is not thinking-speaking', () => {
    aiStateValue = 'idle';
    subtitleTextValue = 'Thinking...';
    fullResponseValue = 'full-response';

    (globalThis as any).__interruptAiStateValue = aiStateValue;
    (globalThis as any).__interruptFullResponseValue = fullResponseValue;
    (globalThis as any).__interruptSubtitleTextValue = subtitleTextValue;
    (globalThis as any).__interruptStopCurrentAudioAndLipSyncMock = vi.fn();
    (globalThis as any).__interruptSendMessageMock = vi.fn();
    (globalThis as any).__interruptClearResponseMock = vi.fn();
    (globalThis as any).__interruptSetAiStateMock = vi.fn();
    (globalThis as any).__interruptSetSubtitleTextMock = vi.fn();
    (globalThis as any).__interruptClearQueueMock = vi.fn();

    const { result } = renderHook(() => useInterrupt());

    act(() => {
      result.current.interrupt();
    });

    expect((globalThis as any).__interruptStopCurrentAudioAndLipSyncMock).not.toHaveBeenCalled();
    expect((globalThis as any).__interruptClearQueueMock).not.toHaveBeenCalled();
    expect((globalThis as any).__interruptSetAiStateMock).not.toHaveBeenCalled();
    expect((globalThis as any).__interruptSendMessageMock).not.toHaveBeenCalled();
    expect((globalThis as any).__interruptClearResponseMock).not.toHaveBeenCalled();
    expect((globalThis as any).__interruptSetSubtitleTextMock).not.toHaveBeenCalled();
  });

  it('interrupts with sendSignal=true and clears subtitle when it says Thinking...', () => {
    aiStateValue = 'thinking-speaking';
    subtitleTextValue = 'Thinking...';
    fullResponseValue = 'full-response';

    stopCurrentAudioAndLipSyncMock = vi.fn();
    sendMessageMock = vi.fn();
    clearResponseMock = vi.fn();
    setAiStateMock = vi.fn();
    setSubtitleTextMock = vi.fn();
    clearQueueMock = vi.fn();

    (globalThis as any).__interruptAiStateValue = aiStateValue;
    (globalThis as any).__interruptFullResponseValue = fullResponseValue;
    (globalThis as any).__interruptSubtitleTextValue = subtitleTextValue;
    (globalThis as any).__interruptStopCurrentAudioAndLipSyncMock = stopCurrentAudioAndLipSyncMock;
    (globalThis as any).__interruptSendMessageMock = sendMessageMock;
    (globalThis as any).__interruptClearResponseMock = clearResponseMock;
    (globalThis as any).__interruptSetAiStateMock = setAiStateMock;
    (globalThis as any).__interruptSetSubtitleTextMock = setSubtitleTextMock;
    (globalThis as any).__interruptClearQueueMock = clearQueueMock;

    const { result } = renderHook(() => useInterrupt());

    act(() => {
      result.current.interrupt();
    });

    expect(stopCurrentAudioAndLipSyncMock).toHaveBeenCalledTimes(1);
    expect(clearQueueMock).toHaveBeenCalledTimes(1);
    expect(setAiStateMock).toHaveBeenCalledWith('interrupted');
    expect(sendMessageMock).toHaveBeenCalledWith({
      type: 'interrupt-signal',
      text: fullResponseValue,
    });
    expect(clearResponseMock).toHaveBeenCalledTimes(1);
    expect(setSubtitleTextMock).toHaveBeenCalledWith('');
  });

  it('interrupts with sendSignal=false without sending websocket message', () => {
    aiStateValue = 'thinking-speaking';
    subtitleTextValue = 'Other subtitle';
    fullResponseValue = 'full-response';

    stopCurrentAudioAndLipSyncMock = vi.fn();
    sendMessageMock = vi.fn();
    clearResponseMock = vi.fn();
    setAiStateMock = vi.fn();
    setSubtitleTextMock = vi.fn();
    clearQueueMock = vi.fn();

    (globalThis as any).__interruptAiStateValue = aiStateValue;
    (globalThis as any).__interruptFullResponseValue = fullResponseValue;
    (globalThis as any).__interruptSubtitleTextValue = subtitleTextValue;
    (globalThis as any).__interruptStopCurrentAudioAndLipSyncMock = stopCurrentAudioAndLipSyncMock;
    (globalThis as any).__interruptSendMessageMock = sendMessageMock;
    (globalThis as any).__interruptClearResponseMock = clearResponseMock;
    (globalThis as any).__interruptSetAiStateMock = setAiStateMock;
    (globalThis as any).__interruptSetSubtitleTextMock = setSubtitleTextMock;
    (globalThis as any).__interruptClearQueueMock = clearQueueMock;

    const { result } = renderHook(() => useInterrupt());

    act(() => {
      result.current.interrupt(false);
    });

    expect(stopCurrentAudioAndLipSyncMock).toHaveBeenCalledTimes(1);
    expect(clearQueueMock).toHaveBeenCalledTimes(1);
    expect(setAiStateMock).toHaveBeenCalledWith('interrupted');
    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(clearResponseMock).toHaveBeenCalledTimes(1);
    expect(setSubtitleTextMock).not.toHaveBeenCalled();
  });
});
