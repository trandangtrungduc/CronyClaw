import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTextInput } from './use-text-input';

const g = globalThis as any;

vi.mock('@/context/websocket-context', () => ({
  useWebSocket: () => ({
    sendMessage: (...args: any[]) => g.__wsSendMessageMock(...args),
  }),
}));

vi.mock('@/context/ai-state-context', () => ({
  useAiState: () => ({
    aiState: g.__aiStateValue,
  }),
}));

vi.mock('@/components/canvas/live2d', () => ({
  useInterrupt: () => ({
    interrupt: (...args: any[]) => g.__interruptMock(...args),
  }),
}));

vi.mock('@/context/chat-history-context', () => ({
  useChatHistory: () => ({
    appendHumanMessage: (...args: any[]) => g.__appendHumanMessageMock(...args),
  }),
}));

vi.mock('@/context/vad-context', () => ({
  useVAD: () => ({
    stopMic: (...args: any[]) => g.__stopMicMock(...args),
    autoStopMic: g.__autoStopMicValue,
  }),
}));

vi.mock('@/hooks/utils/use-media-capture', () => ({
  useMediaCapture: () => ({
    captureAllMedia: (...args: any[]) => g.__captureAllMediaMock(...args),
  }),
}));

vi.mock('@/config/slash-commands', () => {
  const SLASH_COMMANDS_MOCK = [{ id: 'help' }, { id: 'hello' }, { id: 'img' }];
  return {
    SLASH_COMMANDS: SLASH_COMMANDS_MOCK,
    findSlashCommandById: (id: string) => SLASH_COMMANDS_MOCK.find((c) => c.id === id) ?? null,
  };
});

describe('useTextInput', () => {
  beforeEach(() => {
    g.__wsSendMessageMock = vi.fn();
    g.__captureAllMediaMock = vi.fn().mockResolvedValue([]);
    g.__interruptMock = vi.fn();
    g.__appendHumanMessageMock = vi.fn();
    g.__stopMicMock = vi.fn();
    g.__autoStopMicValue = false;
    g.__aiStateValue = 'idle';
  });

  it('opens slash menu and cycles highlight with arrow keys, then picks with Tab', async () => {
    const { result } = renderHook(() => useTextInput());

    act(() => {
      result.current.setInputText({ target: { value: '/he' } } as any);
    });
    expect(result.current.slashAssist.menuOpen).toBe(true);
    expect(result.current.slashAssist.highlightIndex).toBe(0);

    const preventDefault = vi.fn();
    act(() => {
      result.current.handleKeyPress({
        key: 'ArrowDown',
        preventDefault,
      } as any);
    });
    expect(result.current.slashAssist.highlightIndex).toBe(1);

    act(() => {
      result.current.handleKeyPress({
        key: 'Tab',
        preventDefault,
      } as any);
    });

    expect(result.current.inputText).toBe('/hello ');
    expect(result.current.slashAssist.menuOpen).toBe(false);
  });

  it('closes slash menu on Escape when menu is open', () => {
    const { result } = renderHook(() => useTextInput());

    act(() => {
      result.current.setInputText({ target: { value: '/he' } } as any);
    });
    expect(result.current.slashAssist.menuOpen).toBe(true);

    const preventDefault = vi.fn();
    act(() => {
      result.current.handleKeyPress({
        key: 'Escape',
        preventDefault,
      } as any);
    });

    expect(result.current.slashAssist.menuOpen).toBe(false);
  });

  it('handleSend sends message, interrupts when thinking-speaking, and clears input', async () => {
    g.__aiStateValue = 'thinking-speaking';
    g.__autoStopMicValue = true;
    g.__captureAllMediaMock.mockResolvedValue(['img1']);

    const { result } = renderHook(() => useTextInput());

    act(() => {
      result.current.setInputText({ target: { value: 'hi there' } } as any);
    });

    await act(async () => {
      await result.current.handleSend();
    });

    expect(g.__interruptMock).toHaveBeenCalledTimes(1);
    expect(g.__captureAllMediaMock).toHaveBeenCalledTimes(1);
    expect(g.__appendHumanMessageMock).toHaveBeenCalledWith('hi there');
    expect(g.__wsSendMessageMock).toHaveBeenCalledWith({
      type: 'text-input',
      text: 'hi there',
      images: ['img1'],
    });
    expect(g.__stopMicMock).toHaveBeenCalledTimes(1);

    expect(result.current.inputText).toBe('');
    expect(result.current.slashAssist.menuOpen).toBe(false);
  });

  it('ignores Enter key while composing', async () => {
    const { result } = renderHook(() => useTextInput());

    act(() => {
      result.current.setInputText({ target: { value: 'hey' } } as any);
    });

    act(() => {
      result.current.handleCompositionStart();
    });

    act(() => {
      result.current.handleKeyPress({
        key: 'Enter',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as any);
    });

    expect(g.__wsSendMessageMock).not.toHaveBeenCalled();

    act(() => {
      result.current.handleCompositionEnd();
    });

    act(() => {
      result.current.handleKeyPress({
        key: 'Enter',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as any);
    });

    await waitFor(() => {
      expect(g.__wsSendMessageMock).toHaveBeenCalled();
    });
  });
});
