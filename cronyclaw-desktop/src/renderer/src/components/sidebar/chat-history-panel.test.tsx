import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import ChatHistoryPanel from './chat-history-panel';
import type { Message } from '@/services/websocket-service';

vi.mock('@chatscope/chat-ui-kit-react', () => ({
  MainContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="cc-main">{children}</div>
  ),
  ChatContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="cc-chat">{children}</div>
  ),
  MessageList: ({ children }: { children: ReactNode }) => (
    <div data-testid="cc-list">{children}</div>
  ),
  Message: ({ children }: { children: ReactNode }) => (
    <div data-testid="cc-message">{children}</div>
  ),
  Avatar: ({ children }: { children: ReactNode }) => (
    <div data-testid="cc-avatar">{children}</div>
  ),
}));

const mockUseChatHistory = vi.fn();

vi.mock('@/context/chat-history-context', () => ({
  useChatHistory: () => mockUseChatHistory(),
}));

vi.mock('@/context/character-config-context', () => ({
  useConfig: () => ({ confName: 'Bot' }),
}));

vi.mock('@/context/websocket-context', () => ({
  useWebSocket: () => ({ baseUrl: 'http://localhost' }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => `t:${k}` }),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('ChatHistoryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChatHistory.mockImplementation(() => ({ messages: [] as Message[] }));
  });

  it('shows empty state when there are no messages', () => {
    wrap(<ChatHistoryPanel />);
    expect(screen.getByText('t:sidebar.noMessages')).not.toBeNull();
    expect(screen.getByTestId('cc-list')).not.toBeNull();
  });

  it('renders chat message rows for plain text messages', () => {
    const messages: Message[] = [
      {
        id: 'a',
        role: 'human',
        content: 'Hello',
        timestamp: '2026-04-02T12:00:00.000Z',
      },
    ];
    mockUseChatHistory.mockImplementation(() => ({ messages }));
    wrap(<ChatHistoryPanel />);
    expect(screen.queryByText('t:sidebar.noMessages')).toBeNull();
    expect(screen.getAllByTestId('cc-message').length).toBe(1);
  });

  it('renders tool call row for running tool message', () => {
    const messages: Message[] = [
      {
        id: 't1',
        role: 'ai',
        content: '',
        timestamp: '2026-04-02T12:00:00.000Z',
        type: 'tool_call_status',
        tool_id: 'x',
        tool_name: 'search',
        status: 'running',
        name: 'Agent',
      },
    ];
    mockUseChatHistory.mockImplementation(() => ({ messages }));
    wrap(<ChatHistoryPanel />);
    expect(screen.getByText(/Agent is using tool search/)).not.toBeNull();
  });
});
