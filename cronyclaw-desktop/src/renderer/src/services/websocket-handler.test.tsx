import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/context/websocket-context', () => {
  const WebSocketContext = React.createContext<any>(null);
  return {
    WebSocketContext,
    defaultWsUrl: 'ws://default-url',
    defaultBaseUrl: 'http://default-base',
  };
});

vi.mock('@/hooks/utils/use-local-storage', () => ({
  useLocalStorage: (_key: string, defaultValue: any) => {
    if (_key === 'wsUrl') return ['ws://mock-ws', vi.fn()] as any;
    if (_key === 'baseUrl') return ['http://mock-base', vi.fn()] as any;
    return [defaultValue, vi.fn()] as any;
  },
}));

vi.mock('@/context/ai-state-context', () => ({
  AiState: null,
  useAiState: () => ({
    aiState: (globalThis as any).__wsAiState,
    backendSynthComplete: false,
    setBackendSynthComplete: vi.fn(),
    setAiState: (...args: any[]) => (globalThis as any).__wsSetAiState(...args),
  }),
}));

vi.mock('@/context/live2d-config-context', () => ({
  ModelInfo: {},
  useLive2DConfig: () => ({
    setModelInfo: (...args: any[]) => (globalThis as any).__wsSetModelInfo(...args),
  }),
}));

vi.mock('@/context/subtitle-context', () => ({
  useSubtitle: () => ({
    setSubtitleText: (...args: any[]) => (globalThis as any).__wsSetSubtitleText(...args),
  }),
}));

vi.mock('@/context/chat-history-context', () => ({
  useChatHistory: () => ({
    clearResponse: (...args: any[]) => (globalThis as any).__wsClearResponse(...args),
    setForceNewMessage: (...args: any[]) => (globalThis as any).__wsSetForceNewMessage(...args),
    appendHumanMessage: (...args: any[]) => (globalThis as any).__wsAppendHumanMessage(...args),
    appendOrUpdateToolCallMessage: (...args: any[]) => (globalThis as any).__wsAppendOrUpdateToolCallMessage(...args),
    setCurrentHistoryUid: (...args: any[]) => (globalThis as any).__wsSetCurrentHistoryUid(...args),
    setMessages: (...args: any[]) => (globalThis as any).__wsSetMessages(...args),
    setHistoryList: (...args: any[]) => (globalThis as any).__wsSetHistoryList(...args),
  }),
}));

vi.mock('@/components/canvas/live2d', () => ({
  useAudioTask: () => ({
    addAudioTask: (...args: any[]) => (globalThis as any).__wsAddAudioTask(...args),
  }),
}));

vi.mock('@/context/bgurl-context', () => ({
  useBgUrl: () => ({
    setBackgroundFiles: (...args: any[]) => (globalThis as any).__wsSetBackgroundFiles(...args),
  }),
}));

vi.mock('@/context/character-config-context', () => ({
  useConfig: () => ({
    confUid: (globalThis as any).__wsConfUid,
    setConfName: (...args: any[]) => (globalThis as any).__wsSetConfName(...args),
    setConfUid: (...args: any[]) => (globalThis as any).__wsSetConfUid(...args),
    setConfigFiles: (...args: any[]) => (globalThis as any).__wsSetConfigFiles(...args),
  }),
}));

vi.mock('@/context/group-context', () => ({
  useGroup: () => ({
    setSelfUid: (...args: any[]) => (globalThis as any).__wsSetSelfUid(...args),
    setGroupMembers: (...args: any[]) => (globalThis as any).__wsSetGroupMembers(...args),
    setIsOwner: (...args: any[]) => (globalThis as any).__wsSetIsOwner(...args),
  }),
}));

vi.mock('@/context/vad-context', () => ({
  useVAD: () => ({
    startMic: (...args: any[]) => (globalThis as any).__wsStartMic(...args),
    stopMic: (...args: any[]) => (globalThis as any).__wsStopMic(...args),
    autoStartMicOnConvEnd: (globalThis as any).__wsAutoStartMicOnConvEnd,
  }),
}));

vi.mock('@/hooks/utils/use-interrupt', () => ({
  useInterrupt: () => ({
    interrupt: (...args: any[]) => (globalThis as any).__wsInterrupt(...args),
  }),
}));

vi.mock('@/context/browser-context', () => ({
  useBrowser: () => ({
    setBrowserViewData: (...args: any[]) => (globalThis as any).__wsSetBrowserViewData(...args),
  }),
}));

vi.mock('@/utils/task-queue', () => ({
  audioTaskQueue: {
    clearQueue: (...args: any[]) => (globalThis as any).__wsClearAudioTaskQueue(...args),
    addTask: (...args: any[]) => (globalThis as any).__wsAudioTaskQueueAddTask(...args),
    hasTask: () => false,
  },
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: (...args: any[]) => (globalThis as any).__wsToasterCreate(...args),
  },
}));

vi.mock('@/services/websocket-service', () => {
  const wsService = {
    connect: vi.fn(),
    sendMessage: vi.fn(),
    onStateChange: vi.fn((cb: any) => {
      (globalThis as any).__wsOnStateChangeCb = cb;
      return { unsubscribe: vi.fn() };
    }),
    onMessage: vi.fn((cb: any) => {
      (globalThis as any).__wsOnMessageCb = cb;
      return { unsubscribe: vi.fn() };
    }),
  };
  return { wsService };
});

describe('websocket-handler', () => {
  beforeEach(() => {
    (globalThis as any).__wsAiState = 'idle';
    (globalThis as any).__wsConfUid = '';
    (globalThis as any).__wsAutoStartMicOnConvEnd = true;

    (globalThis as any).__wsSetAiState = vi.fn();
    (globalThis as any).__wsSetModelInfo = vi.fn();
    (globalThis as any).__wsSetSubtitleText = vi.fn();
    (globalThis as any).__wsClearResponse = vi.fn();
    (globalThis as any).__wsSetForceNewMessage = vi.fn();
    (globalThis as any).__wsAppendHumanMessage = vi.fn();
    (globalThis as any).__wsAppendOrUpdateToolCallMessage = vi.fn();
    (globalThis as any).__wsSetCurrentHistoryUid = vi.fn();
    (globalThis as any).__wsSetMessages = vi.fn();
    (globalThis as any).__wsSetHistoryList = vi.fn();
    (globalThis as any).__wsAddAudioTask = vi.fn();
    (globalThis as any).__wsSetBackgroundFiles = vi.fn();
    (globalThis as any).__wsSetConfName = vi.fn();
    (globalThis as any).__wsSetConfUid = vi.fn();
    (globalThis as any).__wsSetConfigFiles = vi.fn();
    (globalThis as any).__wsSetSelfUid = vi.fn();
    (globalThis as any).__wsSetGroupMembers = vi.fn();
    (globalThis as any).__wsSetIsOwner = vi.fn();
    (globalThis as any).__wsStartMic = vi.fn();
    (globalThis as any).__wsStopMic = vi.fn();
    (globalThis as any).__wsInterrupt = vi.fn();
    (globalThis as any).__wsSetBrowserViewData = vi.fn();
    (globalThis as any).__wsClearAudioTaskQueue = vi.fn();
    (globalThis as any).__wsAudioTaskQueueAddTask = vi.fn((task: any) => {
      (globalThis as any).__wsCapturedAudioTask = task;
    });
    (globalThis as any).__wsToasterCreate = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).__wsOnMessageCb = undefined;
    (globalThis as any).__wsCapturedAudioTask = undefined;
  });

  it('handles conversation-chain-start by setting aiState, clearing audio queue, and clearing response', async () => {
    const mod = await import('./websocket-handler');
    const WebSocketHandler = mod.default;

    render(
      <WebSocketHandler>
        <div>child</div>
      </WebSocketHandler>,
    );

    const onMessageCb = (globalThis as any).__wsOnMessageCb;
    expect(typeof onMessageCb).toBe('function');

    act(() => {
      onMessageCb({
        type: 'control',
        text: 'conversation-chain-start',
      });
    });

    expect((globalThis as any).__wsSetAiState).toHaveBeenCalledWith('thinking-speaking');
    expect((globalThis as any).__wsClearAudioTaskQueue).toHaveBeenCalledTimes(1);
    expect((globalThis as any).__wsClearResponse).toHaveBeenCalledTimes(1);
  });

  it('handles conversation-chain-end by enqueuing a task that auto-starts mic and returns idle', async () => {
    const mod = await import('./websocket-handler');
    const WebSocketHandler = mod.default;

    render(
      <WebSocketHandler>
        <div>child</div>
      </WebSocketHandler>,
    );

    (globalThis as any).__wsSetAiState = vi.fn((arg: any) => {
      if (typeof arg === 'function') {
        return arg('thinking-speaking');
      }
      return arg;
    });

    const onMessageCb = (globalThis as any).__wsOnMessageCb;

    act(() => {
      onMessageCb({
        type: 'control',
        text: 'conversation-chain-end',
      });
    });

    expect((globalThis as any).__wsAudioTaskQueueAddTask).toHaveBeenCalledTimes(1);
    expect(typeof (globalThis as any).__wsCapturedAudioTask).toBe('function');

    await act(async () => {
      await (globalThis as any).__wsCapturedAudioTask();
    });

    expect((globalThis as any).__wsStartMic).toHaveBeenCalledTimes(1);
    expect((globalThis as any).__wsSetAiState).toHaveBeenCalledTimes(1);
  });

  it('handles config-switched by setting aiState idle, setting subtitle, toasting, and sending history messages', async () => {
    const mod = await import('./websocket-handler');
    const WebSocketHandler = mod.default;

    render(
      <WebSocketHandler>
        <div>child</div>
      </WebSocketHandler>,
    );

    const onMessageCb = (globalThis as any).__wsOnMessageCb;
    act(() => {
      onMessageCb({
        type: 'config-switched',
      });
    });

    expect((globalThis as any).__wsSetAiState).toHaveBeenCalledWith('idle');
    expect((globalThis as any).__wsSetSubtitleText).toHaveBeenCalledWith('notification.characterLoaded');

    expect((globalThis as any).__wsToasterCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'notification.characterSwitched',
        type: 'success',
        duration: 2000,
      }),
    );

    const { wsService } = await import('@/services/websocket-service');
    expect(wsService.sendMessage).toHaveBeenCalledWith({ type: 'fetch-history-list' });
    expect(wsService.sendMessage).toHaveBeenCalledWith({ type: 'create-new-history' });
  });

  it('handles full-text and error and backend-synth-complete messages', async () => {
    const mod = await import('./websocket-handler');
    const WebSocketHandler = mod.default;

    render(
      <WebSocketHandler>
        <div>child</div>
      </WebSocketHandler>,
    );

    const onMessageCb = (globalThis as any).__wsOnMessageCb;

    act(() => {
      onMessageCb({ type: 'full-text', text: 'hello world' });
      onMessageCb({ type: 'error', message: 'boom' });
      onMessageCb({ type: 'backend-synth-complete' });
    });

    expect((globalThis as any).__wsSetSubtitleText).toHaveBeenCalledWith('hello world');
    expect((globalThis as any).__wsToasterCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'boom',
        type: 'error',
        duration: 2000,
      }),
    );
  });
});
