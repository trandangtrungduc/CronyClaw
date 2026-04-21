import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ChatBubble } from './chat-bubble';
import type { Message } from '@/services/websocket-service';

vi.mock('@/components/ui/avatar', () => ({
  AvatarGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Avatar: ({ name }: { name?: string }) => <span data-testid="bubble-avatar">{name}</span>,
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

const base: Omit<Message, 'role' | 'content' | 'name'> = {
  id: '1',
  timestamp: '2026-04-02T12:00:00.000Z',
};

describe('ChatBubble', () => {
  it('shows AI fallback label when role is ai and name omitted', () => {
    const message: Message = { ...base, role: 'ai', content: 'Hello' };
    wrap(<ChatBubble message={message} />);
    expect(screen.getByTestId('bubble-avatar')).toHaveTextContent('AI');
    expect(screen.getByText('Hello')).not.toBeNull();
  });

  it('shows human fallback label when role is human', () => {
    const message: Message = { ...base, role: 'human', content: 'Hi' };
    wrap(<ChatBubble message={message} />);
    expect(screen.getByTestId('bubble-avatar')).toHaveTextContent('Me');
    expect(screen.getByText('Hi')).not.toBeNull();
  });

  it('uses custom name when provided', () => {
    const message: Message = {
      ...base,
      role: 'ai',
      name: 'Crony',
      content: 'x',
    };
    wrap(<ChatBubble message={message} />);
    expect(screen.getByTestId('bubble-avatar')).toHaveTextContent('Crony');
  });

  it('invokes onClick when root is clicked', () => {
    const onClick = vi.fn();
    const message: Message = { ...base, role: 'human', content: 'c' };
    wrap(<ChatBubble message={message} onClick={onClick} />);
    const contentEl = screen.getByText('c');
    const root = contentEl.parentElement?.parentElement;
    expect(root).toBeTruthy();
    fireEvent.click(root!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
