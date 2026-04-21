import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFooter } from './use-footer';

const g = globalThis as any;

const AI_IDLE = 'idle';
const AI_WAITING = 'waiting';
const AI_THINKING_SPEAKING = 'thinking-speaking';

vi.mock('@/hooks/footer/use-text-input', () => ({
  useTextInput: () => ({
    inputText: g.__inputTextValue,
    setInputText: g.__setInputTextMock,
    handleKeyPress: g.__handleKeyPressMock,
    handleCompositionStart: g.__handleCompositionStartMock,
    handleCompositionEnd: g.__handleCompositionEndMock,
    slashAssist: g.__slashAssistMock,
  }),
}));

vi.mock('@/hooks/utils/use-interrupt', () => ({
  useInterrupt: () => ({
    interrupt: g.__interruptMock,
  }),
}));

vi.mock('@/context/vad-context', () => ({
  useVAD: () => ({
    startMic: g.__startMicMock,
    autoStartMicOn: g.__autoStartMicOnValue,
  }),
}));

vi.mock('@/hooks/utils/use-mic-toggle', () => ({
  useMicToggle: () => ({
    handleMicToggle: g.__handleMicToggleMock,
    micOn: g.__micOnValue,
  }),
}));

vi.mock('@/context/ai-state-context', () => ({
  AiStateEnum: {
    IDLE: 'idle',
    WAITING: 'waiting',
    THINKING_SPEAKING: 'thinking-speaking',
  },
  useAiState: () => ({
    setAiState: g.__setAiStateMock,
    aiState: g.__aiStateValue,
  }),
}));

vi.mock('@/hooks/utils/use-trigger-speak', () => ({
  useTriggerSpeak: () => ({
    sendTriggerSignal: g.__sendTriggerSignalMock,
  }),
}));

vi.mock('@/context/proactive-speak-context', () => ({
  useProactiveSpeak: () => ({
    settings: g.__settingsValue,
  }),
}));

describe('useFooter', () => {
  beforeEach(() => {
    g.__inputTextValue = 'hello';
    g.__setInputTextMock = vi.fn();
    g.__handleKeyPressMock = vi.fn();
    g.__handleCompositionStartMock = vi.fn();
    g.__handleCompositionEndMock = vi.fn();
    g.__slashAssistMock = { recognized: null };

    g.__interruptMock = vi.fn();
    g.__startMicMock = vi.fn();
    g.__autoStartMicOnValue = false;

    g.__handleMicToggleMock = vi.fn();
    g.__micOnValue = false;

    g.__setAiStateMock = vi.fn();
    g.__aiStateValue = AI_IDLE;

    g.__sendTriggerSignalMock = vi.fn();
    g.__settingsValue = { allowButtonTrigger: true };
  });

  it('handleInputChange forwards textarea value and sets aiState to WAITING', () => {
    const { result } = renderHook(() => useFooter());

    act(() => {
      result.current.handleInputChange({
        target: { value: 'new value' },
      } as any);
    });

    expect(g.__setInputTextMock).toHaveBeenCalledWith({
      target: { value: 'new value' },
    });
    expect(g.__setAiStateMock).toHaveBeenCalledWith(AI_WAITING);
  });

  it('handleInterrupt interrupts and starts mic in THINKING_SPEAKING mode', () => {
    g.__aiStateValue = AI_THINKING_SPEAKING;
    g.__autoStartMicOnValue = true;

    const { result } = renderHook(() => useFooter());

    act(() => {
      result.current.handleInterrupt();
    });

    expect(g.__interruptMock).toHaveBeenCalledTimes(1);
    expect(g.__startMicMock).toHaveBeenCalledTimes(1);
    expect(g.__sendTriggerSignalMock).not.toHaveBeenCalled();
  });

  it('handleInterrupt triggers speech when allowButtonTrigger is enabled and not THINKING_SPEAKING', () => {
    g.__aiStateValue = AI_IDLE;
    g.__settingsValue = { allowButtonTrigger: true };

    const { result } = renderHook(() => useFooter());

    act(() => {
      result.current.handleInterrupt();
    });

    expect(g.__interruptMock).not.toHaveBeenCalled();
    expect(g.__startMicMock).not.toHaveBeenCalled();
    expect(g.__sendTriggerSignalMock).toHaveBeenCalledWith(-1);
  });

  it('handleInterrupt does nothing when allowButtonTrigger is disabled and not THINKING_SPEAKING', () => {
    g.__aiStateValue = AI_IDLE;
    g.__settingsValue = { allowButtonTrigger: false };

    const { result } = renderHook(() => useFooter());

    act(() => {
      result.current.handleInterrupt();
    });

    expect(g.__interruptMock).not.toHaveBeenCalled();
    expect(g.__startMicMock).not.toHaveBeenCalled();
    expect(g.__sendTriggerSignalMock).not.toHaveBeenCalled();
  });
});
