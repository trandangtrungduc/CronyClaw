import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioTask } from './use-audio-task';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
  }),
}));

vi.mock('@/context/ai-state-context', () => ({
  useAiState: () => ({
    aiState: (globalThis as any).__audioTaskAiStateValue,
    backendSynthComplete: false,
    setBackendSynthComplete: (globalThis as any).__audioTaskSetBackendSynthCompleteMock,
  }),
}));

vi.mock('@/context/subtitle-context', () => ({
  useSubtitle: () => ({
    setSubtitleText: (globalThis as any).__audioTaskSetSubtitleTextMock,
  }),
}));

vi.mock('@/context/chat-history-context', () => ({
  useChatHistory: () => ({
    appendResponse: (globalThis as any).__audioTaskAppendResponseMock,
    appendAIMessage: (globalThis as any).__audioTaskAppendAIMessageMock,
    fullResponse: 'full-response',
    clearResponse: (globalThis as any).__audioTaskClearResponseMock,
  }),
}));

vi.mock('@/context/websocket-context', () => ({
  useWebSocket: () => ({
    sendMessage: (globalThis as any).__audioTaskSendMessageMock,
  }),
}));

vi.mock('@/hooks/canvas/use-live2d-expression', () => ({
  useLive2DExpression: () => ({
    setExpression: (globalThis as any).__audioTaskSetExpressionMock,
  }),
}));

vi.mock('@/utils/task-queue', () => ({
  audioTaskQueue: {
    addTask: (...args: any[]) => (globalThis as any).__audioTaskAddTaskMock(...args),
    waitForCompletion: () => Promise.resolve(),
    clearQueue: (globalThis as any).__audioTaskClearQueueMock,
  },
}));

vi.mock('@/utils/audio-manager', () => ({
  audioManager: {
    stopCurrentAudioAndLipSync: (...args: any[]) => (globalThis as any).__audioTaskStopCurrentAudioAndLipSyncMock(...args),
    setCurrentAudio: vi.fn(),
    clearCurrentAudio: vi.fn(),
    hasCurrentAudio: vi.fn(),
  },
}));

vi.mock('../../../WebSDK/src/lappdefine', () => ({
  PriorityNormal: 3,
}));

describe('useAudioTask', () => {
  beforeEach(() => {
    (globalThis as any).__audioTaskAiStateValue = 'idle';
    (globalThis as any).__audioTaskSetBackendSynthCompleteMock = vi.fn();
    (globalThis as any).__audioTaskSetSubtitleTextMock = vi.fn();
    (globalThis as any).__audioTaskAppendResponseMock = vi.fn();
    (globalThis as any).__audioTaskAppendAIMessageMock = vi.fn();
    (globalThis as any).__audioTaskClearResponseMock = vi.fn();
    (globalThis as any).__audioTaskSendMessageMock = vi.fn();
    (globalThis as any).__audioTaskSetExpressionMock = vi.fn();
    (globalThis as any).__audioTaskAddTaskMock = vi.fn();
    (globalThis as any).__audioTaskClearQueueMock = vi.fn();
    (globalThis as any).__audioTaskStopCurrentAudioAndLipSyncMock = vi.fn();
  });

  it('stopCurrentAudioAndLipSync delegates to audioManager', () => {
    const { result } = renderHook(() => useAudioTask());
    act(() => {
      result.current.stopCurrentAudioAndLipSync();
    });
    expect((globalThis as any).__audioTaskStopCurrentAudioAndLipSyncMock).toHaveBeenCalledTimes(1);
  });

  it('addAudioTask enqueues a playback task when aiState is not interrupted', async () => {
    const { result } = renderHook(() => useAudioTask());
    await act(async () => {
      await result.current.addAudioTask({
        audioBase64: 'ZHVtbXk=',
        volumes: [1],
        sliceLength: 10,
        displayText: null,
        expressions: ['smile'],
        forwarded: false,
      } as any);
    });

    expect((globalThis as any).__audioTaskAddTaskMock).toHaveBeenCalledTimes(1);
    expect(typeof (globalThis as any).__audioTaskAddTaskMock.mock.calls[0][0]).toBe('function');
  });

  it('skips addAudioTask when aiState is interrupted', async () => {
    (globalThis as any).__audioTaskAiStateValue = 'interrupted';
    const { result } = renderHook(() => useAudioTask());

    await act(async () => {
      await result.current.addAudioTask({
        audioBase64: 'ZHVtbXk=',
        volumes: [1],
        sliceLength: 10,
        displayText: null,
        expressions: ['smile'],
        forwarded: false,
      } as any);
    });

    expect((globalThis as any).__audioTaskAddTaskMock).not.toHaveBeenCalled();
  });
});
