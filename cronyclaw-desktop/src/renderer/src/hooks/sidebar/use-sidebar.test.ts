import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSidebar } from './use-sidebar';

vi.mock('@chakra-ui/react', () => ({
  useDisclosure: () => ({
    isOpen: (globalThis as any).__sidebarIsOpen,
    open: (globalThis as any).__sidebarOpen,
    onOpen: (globalThis as any).__sidebarOnOpen,
    onClose: (globalThis as any).__sidebarOnClose,
  }),
}));

vi.mock('@/context/websocket-context', () => ({
  useWebSocket: () => ({
    sendMessage: (globalThis as any).__sidebarSendMessageMock,
  }),
}));

vi.mock('@/components/canvas/live2d', () => ({
  useInterrupt: () => ({
    interrupt: (globalThis as any).__sidebarInterruptMock,
  }),
}));

vi.mock('@/context/chat-history-context', () => ({
  useChatHistory: () => ({
    currentHistoryUid: (globalThis as any).__sidebarCurrentHistoryUid,
    messages: (globalThis as any).__sidebarMessages,
    updateHistoryList: (globalThis as any).__sidebarUpdateHistoryListMock,
  }),
}));

vi.mock('@/context/mode-context', () => ({
  useMode: () => ({
    mode: (globalThis as any).__sidebarMode,
    setMode: (globalThis as any).__sidebarSetModeMock,
    isElectron: (globalThis as any).__sidebarIsElectron,
  }),
}));

describe('useSidebar', () => {
  beforeEach(() => {
    (globalThis as any).__sidebarOpen = false;
    (globalThis as any).__sidebarIsOpen = false;
    (globalThis as any).__sidebarOnOpen = vi.fn();
    (globalThis as any).__sidebarOnClose = vi.fn();

    (globalThis as any).__sidebarSendMessageMock = vi.fn();
    (globalThis as any).__sidebarInterruptMock = vi.fn();

    (globalThis as any).__sidebarCurrentHistoryUid = 'h1';
    (globalThis as any).__sidebarMessages = [
      { role: 'human', timestamp: 'm1', content: 'a' },
      { role: 'ai', timestamp: 'm2', content: 'b' },
    ];
    (globalThis as any).__sidebarUpdateHistoryListMock = vi.fn();

    (globalThis as any).__sidebarMode = 'window';
    (globalThis as any).__sidebarSetModeMock = vi.fn();
    (globalThis as any).__sidebarIsElectron = false;
  });

  it('exposes disclosure state + mode props', () => {
    const { result } = renderHook(() => useSidebar());

    expect(result.current.settingsOpen).toBe(false);
    expect(result.current.currentMode).toBe('window');
    expect(result.current.isElectron).toBe(false);
    expect(typeof result.current.onSettingsOpen).toBe('function');
    expect(typeof result.current.onSettingsClose).toBe('function');
  });

  it('createNewHistory updates current history with latest message, interrupts, and sends websocket create-new-history', () => {
    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.createNewHistory();
    });

    expect((globalThis as any).__sidebarUpdateHistoryListMock).toHaveBeenCalledWith(
      'h1',
      (globalThis as any).__sidebarMessages[(globalThis as any).__sidebarMessages.length - 1],
    );
    expect((globalThis as any).__sidebarInterruptMock).toHaveBeenCalledTimes(1);
    expect((globalThis as any).__sidebarSendMessageMock).toHaveBeenCalledWith({
      type: 'create-new-history',
    });
  });

  it('createNewHistory does not update history when currentHistoryUid is falsy or messages empty', () => {
    (globalThis as any).__sidebarCurrentHistoryUid = '';
    (globalThis as any).__sidebarMessages = [];

    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.createNewHistory();
    });

    expect((globalThis as any).__sidebarUpdateHistoryListMock).not.toHaveBeenCalled();
    expect((globalThis as any).__sidebarInterruptMock).toHaveBeenCalledTimes(1);
    expect((globalThis as any).__sidebarSendMessageMock).toHaveBeenCalledWith({
      type: 'create-new-history',
    });
  });
});
