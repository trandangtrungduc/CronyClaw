import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGroupDrawer } from './use-group-drawer';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
  }),
}));

vi.mock('@/context/websocket-context', () => ({
  useWebSocket: () => ({
    sendMessage: (globalThis as any).__groupSendMessageMock,
  }),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: (...args: any[]) => (globalThis as any).__groupToasterCreateMock(...args),
  },
}));

describe('useGroupDrawer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as any).__groupSendMessageMock = vi.fn();
    (globalThis as any).__groupToasterCreateMock = vi.fn();
  });

  it('requestGroupInfo sends request-group-info', () => {
    const { result } = renderHook(() => useGroupDrawer());

    act(() => {
      result.current.requestGroupInfo();
    });

    expect((globalThis as any).__groupSendMessageMock).toHaveBeenCalledWith({
      type: 'request-group-info',
    });
  });

  it('handleInvite shows toaster error when inviteUid is empty', () => {
    const { result } = renderHook(() => useGroupDrawer());

    act(() => {
      void result.current.handleInvite();
    });

    expect((globalThis as any).__groupToasterCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'error.enterValidUuid',
        type: 'error',
      }),
    );
    expect((globalThis as any).__groupSendMessageMock).not.toHaveBeenCalled();
  });

  it('handleInvite sends add-client-to-group, clears inviteUid, and requests group info later', async () => {
    const { result } = renderHook(() => useGroupDrawer());

    act(() => {
      result.current.setInviteUid('u-1');
    });

    act(() => {
      void result.current.handleInvite();
    });

    expect((globalThis as any).__groupSendMessageMock).toHaveBeenCalledWith({
      type: 'add-client-to-group',
      invitee_uid: 'u-1',
    });
    expect(result.current.inviteUid).toBe('');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect((globalThis as any).__groupSendMessageMock).toHaveBeenLastCalledWith({
      type: 'request-group-info',
    });
  });

  it('handleRemove sends remove-client-from-group and requests group info later', () => {
    const { result } = renderHook(() => useGroupDrawer());

    act(() => {
      result.current.handleRemove('target-1');
    });

    expect((globalThis as any).__groupSendMessageMock).toHaveBeenCalledWith({
      type: 'remove-client-from-group',
      target_uid: 'target-1',
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect((globalThis as any).__groupSendMessageMock).toHaveBeenLastCalledWith({
      type: 'request-group-info',
    });
  });

  it('handleLeaveGroup sends remove-client-from-group and requests group info later', () => {
    const { result } = renderHook(() => useGroupDrawer());

    act(() => {
      result.current.handleLeaveGroup('self-2');
    });

    expect((globalThis as any).__groupSendMessageMock).toHaveBeenCalledWith({
      type: 'remove-client-from-group',
      target_uid: 'self-2',
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect((globalThis as any).__groupSendMessageMock).toHaveBeenLastCalledWith({
      type: 'request-group-info',
    });
  });
});
