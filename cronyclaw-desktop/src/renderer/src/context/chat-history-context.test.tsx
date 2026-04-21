import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ChatHistoryProvider, useChatHistory } from './chat-history-context';
import type { HistoryInfo } from './websocket-context';
import type { Message } from '@/services/websocket-service';

function wrap(ui: ReactNode) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <ChatHistoryProvider>{ui}</ChatHistoryProvider>
    </ChakraProvider>,
  );
}

function Consumer() {
  const {
    messages,
    historyList,
    appendHumanMessage,
    appendAIMessage,
    setForceNewMessage,
    setMessages,
    setHistoryList,
    setCurrentHistoryUid,
    updateHistoryList,
    appendOrUpdateToolCallMessage,
  } = useChatHistory();

  return (
    <div>
      <span data-testid="msgCount">{messages.length}</span>
      <span data-testid="lastRole">{messages.at(-1)?.role ?? 'none'}</span>
      <span data-testid="lastContent">{messages.at(-1)?.content ?? ''}</span>
      <button type="button" onClick={() => appendHumanMessage('hi')}>
        addHuman
      </button>
      <button type="button" onClick={() => appendAIMessage('a')}>
        addAI
      </button>
      <button type="button" onClick={() => appendAIMessage('b')}>
        addAI2
      </button>
      <button type="button" onClick={() => setForceNewMessage(true)}>
        forceNew
      </button>
      <button
        type="button"
        onClick={() =>
          setHistoryList([
            {
              uid: 'h1',
              latest_message: null,
              timestamp: '2026-04-02T12:00:00.000Z',
            } as HistoryInfo,
          ])
        }
      >
        setHistory
      </button>
      <button type="button" onClick={() => setCurrentHistoryUid('h1')}>
        setCurrent
      </button>
      <button
        type="button"
        onClick={() =>
          updateHistoryList('h1', {
            id: 'm1',
            role: 'ai',
            type: 'text' as any,
            content: 'preview',
            timestamp: '2026-04-02T12:01:00.000Z',
          } as Message)
        }
      >
        updateLatest
      </button>
      <button
        type="button"
        onClick={() =>
          appendOrUpdateToolCallMessage({
            tool_id: 'tool-1',
            tool_name: 'search',
            status: 'running',
            timestamp: '2026-04-02T12:00:00.000Z',
            name: 'Agent',
            content: 'in',
          } as any)
        }
      >
        toolCreate
      </button>
      <button
        type="button"
        onClick={() =>
          appendOrUpdateToolCallMessage({
            tool_id: 'tool-1',
            tool_name: 'search',
            status: 'completed',
            timestamp: '2026-04-02T12:02:00.000Z',
            name: 'Agent',
            content: 'out',
          } as any)
        }
      >
        toolUpdate
      </button>
      <span data-testid="historyLatest">
        {historyList[0]?.latest_message?.content ?? ''}
      </span>
      <span data-testid="toolStatus">
        {messages.find((m) => m.type === 'tool_call_status')?.status ?? 'none'}
      </span>
      <button type="button" onClick={() => setMessages([])}>
        clear
      </button>
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <div data-testid="caught">{this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

describe('ChatHistoryContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-02T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('appends human and AI messages', () => {
    wrap(<Consumer />);

    expect(screen.getByTestId('msgCount').textContent).toBe('0');
    fireEvent.click(screen.getByText('addHuman'));
    expect(screen.getByTestId('msgCount').textContent).toBe('1');
    expect(screen.getByTestId('lastRole').textContent).toBe('human');
    expect(screen.getByTestId('lastContent').textContent).toBe('hi');

    fireEvent.click(screen.getByText('addAI'));
    expect(screen.getByTestId('msgCount').textContent).toBe('2');
    expect(screen.getByTestId('lastRole').textContent).toBe('ai');
    expect(screen.getByTestId('lastContent').textContent).toBe('a');
  });

  it('merges consecutive AI text messages unless forceNewMessage is set', () => {
    wrap(<Consumer />);

    fireEvent.click(screen.getByText('addAI'));
    fireEvent.click(screen.getByText('addAI2'));
    expect(screen.getByTestId('msgCount').textContent).toBe('1');
    expect(screen.getByTestId('lastContent').textContent).toBe('ab');

    fireEvent.click(screen.getByText('forceNew'));
    fireEvent.click(screen.getByText('addAI'));
    expect(screen.getByTestId('msgCount').textContent).toBe('2');
  });

  it('updates history latest message when currentHistoryUid is set', () => {
    wrap(<Consumer />);
    fireEvent.click(screen.getByText('setHistory'));
    fireEvent.click(screen.getByText('setCurrent'));
    expect(screen.getByTestId('historyLatest').textContent).toBe('');

    fireEvent.click(screen.getByText('updateLatest'));
    expect(screen.getByTestId('historyLatest').textContent).toBe('preview');
  });

  it('appends and updates tool call messages by tool_id', () => {
    wrap(<Consumer />);
    fireEvent.click(screen.getByText('toolCreate'));
    expect(screen.getByTestId('toolStatus').textContent).toBe('running');

    fireEvent.click(screen.getByText('toolUpdate'));
    expect(screen.getByTestId('toolStatus').textContent).toBe('completed');
  });

  it('throws when used outside provider', () => {
    const Broken = () => {
      useChatHistory();
      return null;
    };
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('caught').textContent).toBe(
      'useChatHistory must be used within a ChatHistoryProvider',
    );
  });
});
