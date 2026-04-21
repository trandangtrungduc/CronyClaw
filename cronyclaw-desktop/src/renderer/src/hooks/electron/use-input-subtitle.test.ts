import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInputSubtitle } from './use-input-subtitle';

const AI_IDLE = 'idle';
const AI_WAITING = 'waiting';
const AI_THINKING_SPEAKING = 'thinking-speaking';

let inputValue = 'initial';
let messages: Array<{ role: 'human' | 'ai'; content: string }> = [];
let aiStateValue = AI_IDLE;
let micOnValue = false;
let autoStartMicOnValue = false;

const setInputTextMock = vi.fn();
const handleKeyMock = vi.fn();
const handleCompositionStartMock = vi.fn();
const handleCompositionEndMock = vi.fn();
const handleSendMock = vi.fn();
const slashAssistMock = { enabled: true };

const startMicMock = vi.fn();
const handleMicToggleMock = vi.fn();
const setAiStateMock = vi.fn();
const interruptMock = vi.fn();

vi.mock('@/hooks/footer/use-text-input', () => ({
  useTextInput: () => ({
    inputText: inputValue,
    setInputText: setInputTextMock,
    handleKeyPress: handleKeyMock,
    handleCompositionStart: handleCompositionStartMock,
    handleCompositionEnd: handleCompositionEndMock,
    handleSend: handleSendMock,
    slashAssist: slashAssistMock,
  }),
}));

vi.mock('@/context/chat-history-context', () => ({
  useChatHistory: () => ({
    messages,
  }),
}));

vi.mock('@/context/vad-context', () => ({
  useVAD: () => ({
    startMic: startMicMock,
    autoStartMicOn: autoStartMicOnValue,
  }),
}));

vi.mock('@/hooks/utils/use-mic-toggle', () => ({
  useMicToggle: () => ({
    handleMicToggle: handleMicToggleMock,
    micOn: micOnValue,
  }),
}));

vi.mock('@/context/ai-state-context', () => ({
  AiStateEnum: {
    IDLE: 'idle',
    WAITING: 'waiting',
    THINKING_SPEAKING: 'thinking-speaking',
  },
  useAiState: () => ({
    aiState: aiStateValue,
    setAiState: setAiStateMock,
  }),
}));

vi.mock('@/hooks/utils/use-interrupt', () => ({
  useInterrupt: () => ({
    interrupt: interruptMock,
  }),
}));

describe('useInputSubtitle', () => {
  beforeEach(() => {
    inputValue = 'initial';
    messages = [];
    aiStateValue = AI_IDLE;
    micOnValue = false;
    autoStartMicOnValue = false;

    setInputTextMock.mockClear();
    handleKeyMock.mockClear();
    handleCompositionStartMock.mockClear();
    handleCompositionEndMock.mockClear();
    handleSendMock.mockClear();
    startMicMock.mockClear();
    handleMicToggleMock.mockClear();
    setAiStateMock.mockClear();
    interruptMock.mockClear();
  });

  it('computes lastAIMessage and hasAIMessages', () => {
    messages = [
      { role: 'human', content: 'hi' },
      { role: 'ai', content: 'first' },
      { role: 'ai', content: 'second' },
    ];

    const { result } = renderHook(() => useInputSubtitle());

    expect(result.current.hasAIMessages).toBe(true);
    expect(result.current.lastAIMessage).toBe('second');
  });

  it('lastAIMessage is undefined when there are no AI messages', () => {
    messages = [{ role: 'human', content: 'hi' }];

    const { result } = renderHook(() => useInputSubtitle());
    expect(result.current.hasAIMessages).toBe(false);
    expect(result.current.lastAIMessage).toBeUndefined();
  });

  it('handleInputChange forwards value and sets aiState to WAITING', () => {
    const { result } = renderHook(() => useInputSubtitle());

    act(() => {
      result.current.handleInputChange({
        target: { value: 'new value' },
      } as any);
    });

    expect(setInputTextMock).toHaveBeenCalledTimes(1);
    expect(setInputTextMock.mock.calls[0][0]).toEqual({
      target: { value: 'new value' },
    });
    expect(setAiStateMock).toHaveBeenCalledWith(AI_WAITING);
  });

  it('handleKeyPress forwards event to useTextInput handleKeyPress', () => {
    const { result } = renderHook(() => useInputSubtitle());

    const keyEvent = { key: 'Enter' } as any;
    act(() => {
      result.current.handleKeyPress(keyEvent);
    });

    expect(handleKeyMock).toHaveBeenCalledWith(keyEvent);
  });

  it('handleInterrupt calls interrupt and starts mic when autoStartMicOn is true', () => {
    autoStartMicOnValue = true;
    const { result } = renderHook(() => useInputSubtitle());

    act(() => {
      result.current.handleInterrupt();
    });

    expect(interruptMock).toHaveBeenCalledTimes(1);
    expect(startMicMock).toHaveBeenCalledTimes(1);
  });

  it('handleInterrupt calls interrupt but does not start mic when autoStartMicOn is false', () => {
    autoStartMicOnValue = false;
    const { result } = renderHook(() => useInputSubtitle());

    act(() => {
      result.current.handleInterrupt();
    });

    expect(interruptMock).toHaveBeenCalledTimes(1);
    expect(startMicMock).not.toHaveBeenCalled();
  });

  it('forwards micOn, aiState, and passthrough handlers from dependencies', () => {
    aiStateValue = AI_THINKING_SPEAKING;
    micOnValue = true;

    const { result } = renderHook(() => useInputSubtitle());
    expect(result.current.aiState).toBe(AI_THINKING_SPEAKING);
    expect(result.current.micOn).toBe(true);
    expect(result.current.handleMicToggle).toBe(handleMicToggleMock);
    expect(result.current.handleSend).toBe(handleSendMock);
    expect(result.current.slashAssist).toBe(slashAssistMock);
    expect(typeof result.current.handleCompositionStart).toBe('function');
    expect(typeof result.current.handleCompositionEnd).toBe('function');
  });
});
