import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistoryDrawer } from './use-history-drawer';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
  }),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: (...args: any[]) => (globalThis as any).__historyToasterCreateMock(...args),
  },
}));

vi.mock('@/context/websocket-context', () => ({
  useWebSocket: () => ({
    sendMessage: (globalThis as any).__historySendMessageMock,
  }),
}));

vi.mock('@/context/chat-history-context', () => ({
  useChatHistory: () => ({
    historyList: (globalThis as any).__historyListMock,
    currentHistoryUid: (globalThis as any).__currentHistoryUidMock,
    setCurrentHistoryUid: (globalThis as any).__setCurrentHistoryUidMock,
    setHistoryList: (globalThis as any).__setHistoryListMock,
    messages: (globalThis as any).__messagesMock,
    updateHistoryList: (globalThis as any).__updateHistoryListMock,
  }),
}));

describe('useHistoryDrawer', () => {
  beforeEach(() => {
    (globalThis as any).__historyToasterCreateMock = vi.fn();
    (globalThis as any).__historySendMessageMock = vi.fn();

    (globalThis as any).__historyListMock = [
      {
        uid: 'h1',
        latest_message: { role: 'human', timestamp: 't1', content: 'old' },
        timestamp: 't1',
      },
      {
        uid: 'h2',
        latest_message: { role: 'ai', timestamp: 't2', content: 'x' },
        timestamp: 't2',
      },
    ];

    (globalThis as any).__currentHistoryUidMock = 'h1';
    (globalThis as any).__setCurrentHistoryUidMock = vi.fn();
    (globalThis as any).__setHistoryListMock = vi.fn();
    (globalThis as any).__messagesMock = [
      { role: 'human', timestamp: 'm1', content: 'hi' },
      { role: 'ai', timestamp: 'm2', content: 'latest ai' },
    ];
    (globalThis as any).__updateHistoryListMock = vi.fn();
  });

  it('fetchAndSetHistory updates previous history with latest message and sends websocket request', () => {
    const { result } = renderHook(() => useHistoryDrawer());

    act(() => {
      result.current.fetchAndSetHistory('h3');
    });

    expect((globalThis as any).__updateHistoryListMock).toHaveBeenCalledWith(
      'h1',
      (globalThis as any).__messagesMock[(globalThis as any).__messagesMock.length - 1],
    );

    expect((globalThis as any).__setCurrentHistoryUidMock).toHaveBeenCalledWith('h3');
    expect((globalThis as any).__historySendMessageMock).toHaveBeenCalledWith({
      type: 'fetch-and-set-history',
      history_uid: 'h3',
    });
  });

  it('fetchAndSetHistory does nothing when uid matches currentHistoryUid', () => {
    const { result } = renderHook(() => useHistoryDrawer());

    act(() => {
      result.current.fetchAndSetHistory('h1');
    });

    expect((globalThis as any).__setCurrentHistoryUidMock).not.toHaveBeenCalled();
    expect((globalThis as any).__historySendMessageMock).not.toHaveBeenCalled();
  });

  it('deleteHistory shows toast error when attempting to delete current history', () => {
    const { result } = renderHook(() => useHistoryDrawer());

    act(() => {
      result.current.deleteHistory('h1');
    });

    expect((globalThis as any).__historySendMessageMock).not.toHaveBeenCalled();
    expect((globalThis as any).__historyToasterCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'error.cannotDeleteCurrentHistory',
        type: 'warning',
      }),
    );
  });

  it('deleteHistory sends delete-history and updates historyList without deleted uid', () => {
    const { result } = renderHook(() => useHistoryDrawer());

    act(() => {
      result.current.deleteHistory('h2');
    });

    expect((globalThis as any).__historySendMessageMock).toHaveBeenCalledWith({
      type: 'delete-history',
      history_uid: 'h2',
    });

    expect((globalThis as any).__setHistoryListMock).toHaveBeenCalledWith([
      {
        uid: 'h1',
        latest_message: { role: 'human', timestamp: 't1', content: 'old' },
        timestamp: 't1',
      },
    ]);
  });

  it('getLatestMessageContent uses current messages when history is current', () => {
    const { result } = renderHook(() => useHistoryDrawer());

    const content = result.current.getLatestMessageContent({
      uid: 'h1',
      latest_message: { role: 'human', timestamp: 't-old', content: 'ignored' },
      timestamp: 't-old',
    });

    expect(content).toEqual({ content: 'latest ai', timestamp: 'm2' });
  });

  it('getLatestMessageContent falls back to history.latest_message when not current', () => {
    const { result } = renderHook(() => useHistoryDrawer());

    const content = result.current.getLatestMessageContent({
      uid: 'h2',
      latest_message: { role: 'ai', timestamp: 't2', content: 'x' },
      timestamp: 't2',
    });

    expect(content).toEqual({ content: 'x', timestamp: 't2' });
  });
});
