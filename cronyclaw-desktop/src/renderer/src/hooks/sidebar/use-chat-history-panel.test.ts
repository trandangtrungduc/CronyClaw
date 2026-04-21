import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatHistoryPanel } from './use-chat-history-panel';

vi.mock('@/context/chat-history-context', () => ({
  useChatHistory: () => ({
    messages: (globalThis as any).__chatMessages ?? [],
  }),
}));

describe('useChatHistoryPanel', () => {
  beforeEach(() => {
    (globalThis as any).__chatMessages = [
      { id: '1', role: 'human', content: 'hi' },
      { id: '2', role: 'ai', content: 'hello' },
    ];
  });

  it('exposes messages from chat history and scrolls on update', () => {
    const { result } = renderHook(() => useChatHistoryPanel());

    expect(result.current.messages).toEqual((globalThis as any).__chatMessages);

    const div = document.createElement('div');
    Object.defineProperty(div, 'scrollHeight', { value: 123, configurable: true });
    div.scrollTop = 0;

    (result.current.messageListRef as any).current = div;

    act(() => {
      result.current.handleMessageUpdate();
    });

    expect(div.scrollTop).toBe(123);
  });
});
