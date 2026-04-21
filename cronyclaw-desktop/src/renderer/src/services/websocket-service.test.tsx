import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toaster } from '@/components/ui/toaster';

vi.mock('i18next', () => ({
  default: {
    t: (key: string) => key,
  },
}));

type AnyMessage = Record<string, any>;

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 3;

  static instances: MockWebSocket[] = [];

  public readyState: number;
  public onopen: null | (() => void) = null;
  public onmessage: null | ((event: { data: string }) => void) = null;
  public onclose: null | (() => void) = null;
  public onerror: null | (() => void) = null;
  public sent: string[] = [];
  public url: string;

  constructor(url: string) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    MockWebSocket.instances.push(this);
  }

  send(payload: string) {
    this.sent.push(payload);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  triggerOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  triggerMessage(data: AnyMessage) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  triggerRawMessage(raw: string) {
    this.onmessage?.({ data: raw });
  }
}

describe('websocket-service', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    (globalThis as any).WebSocket = MockWebSocket;
  });

  it('connect transitions CLOSED -> CONNECTING -> OPEN and sends initial fetch messages on open', async () => {
    const { wsService } = await vi.importActual('@/services/websocket-service');

    toaster.create.mockClear();
    wsService.disconnect();

    const states: string[] = [];
    const unsubState = wsService.onStateChange((s: any) => states.push(s));

    const wsUrl = 'ws://test/socket';
    wsService.connect(wsUrl);

    const instance = MockWebSocket.instances[0];
    expect(instance.url).toBe(wsUrl);
    expect(states).toContain('CONNECTING');

    instance.triggerOpen();

    expect(states).toContain('OPEN');

    const sent = instance.sent.map((x) => JSON.parse(x));
    const types = sent.map((m) => m.type);
    expect(types).toEqual(
      expect.arrayContaining([
        'fetch-backgrounds',
        'fetch-configs',
        'fetch-history-list',
        'create-new-history',
      ]),
    );
    expect(toaster.create).not.toHaveBeenCalled();

    unsubState.unsubscribe();
    wsService.disconnect();
  }, 20000);

  it('onMessage delivers parsed JSON messages to subscribers', async () => {
    const { wsService } = await vi.importActual('@/services/websocket-service');
    wsService.disconnect();

    const messages: AnyMessage[] = [];
    const unsubMessage = wsService.onMessage((m: AnyMessage) => messages.push(m));

    wsService.connect('ws://test/socket-2');
    const instance = MockWebSocket.instances[0];
    instance.triggerOpen();

    instance.triggerMessage({ type: 'control', text: 'start-mic' });
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual({ type: 'control', text: 'start-mic' });

    unsubMessage.unsubscribe();
    wsService.disconnect();
  });

  it('sendMessage warns and creates toast when websocket is not open', async () => {
    const { wsService } = await vi.importActual('@/services/websocket-service');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    toaster.create.mockClear();
    wsService.disconnect();

    wsService.sendMessage({ type: 'hello' });

    expect(warnSpy).toHaveBeenCalled();
    expect(toaster.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
      }),
    );

    warnSpy.mockRestore();
  });

  it('invalid incoming websocket payload triggers toaster error toast', async () => {
    const { wsService } = await vi.importActual('@/services/websocket-service');

    toaster.create.mockClear();
    wsService.disconnect();

    wsService.connect('ws://test/socket-3');
    const instance = MockWebSocket.instances[0];
    instance.triggerOpen();

    instance.triggerRawMessage('this is not json');
    expect(toaster.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
      }),
    );

    wsService.disconnect();
  });
});
