import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { WebSocketProvider, useWebSocket, defaultWsUrl, defaultBaseUrl } from './websocket-context';
import { wsService } from '@/services/websocket-service';

function wrap(ui: ReactNode) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <WebSocketProvider>{ui}</WebSocketProvider>
    </ChakraProvider>,
  );
}

function Consumer() {
  const {
    wsUrl,
    baseUrl,
    sendMessage,
    reconnect,
    setWsUrl,
    setBaseUrl,
  } = useWebSocket();

  return (
    <div>
      <span data-testid="wsUrl">{wsUrl}</span>
      <span data-testid="baseUrl">{baseUrl}</span>
      <button type="button" onClick={() => sendMessage({ hello: 'world' })}>
        send
      </button>
      <button type="button" onClick={() => reconnect()}>
        reconnect
      </button>
      <button type="button" onClick={() => setWsUrl('ws://example.com/new')}>
        setWs
      </button>
      <button type="button" onClick={() => setBaseUrl('http://example.com/new')}>
        setBase
      </button>
    </div>
  );
}

describe('WebSocketContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('provides default wsUrl and baseUrl', () => {
    wrap(<Consumer />);
    expect(screen.getByTestId('wsUrl').textContent).toBe(defaultWsUrl);
    expect(screen.getByTestId('baseUrl').textContent).toBe(defaultBaseUrl);
  });

  it('sendMessage forwards to wsService.sendMessage', () => {
    wrap(<Consumer />);
    fireEvent.click(screen.getByText('send'));
    expect(wsService.sendMessage).toHaveBeenCalledWith({ hello: 'world' });
  });

  it('reconnect calls wsService.connect with current wsUrl', () => {
    wrap(<Consumer />);
    fireEvent.click(screen.getByText('reconnect'));
    expect(wsService.connect).toHaveBeenCalledWith(defaultWsUrl);
  });

  it('setWsUrl updates local storage and connects', async () => {
    wrap(<Consumer />);
    fireEvent.click(screen.getByText('setWs'));

    await waitFor(() => {
      expect(screen.getByTestId('wsUrl').textContent).toBe('ws://example.com/new');
    });
    expect(wsService.connect).toHaveBeenCalledWith('ws://example.com/new');
  });

  it('setBaseUrl updates baseUrl without reconnecting', async () => {
    wrap(<Consumer />);
    fireEvent.click(screen.getByText('setBase'));

    await waitFor(() => {
      expect(screen.getByTestId('baseUrl').textContent).toBe('http://example.com/new');
    });
    expect(wsService.connect).not.toHaveBeenCalled();
  });
});
