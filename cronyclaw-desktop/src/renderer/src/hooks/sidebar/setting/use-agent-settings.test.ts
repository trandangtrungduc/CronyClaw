import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAgentSettings } from './use-agent-settings';

vi.mock('@/context/proactive-speak-context', () => ({
  useProactiveSpeak: () => ({
    settings: (globalThis as any).__agentPersistedSettings,
    updateSettings: (globalThis as any).__agentUpdateSettingsMock,
  }),
}));

describe('useAgentSettings', () => {
  beforeEach(() => {
    (globalThis as any).__agentPersistedSettings = {
      allowProactiveSpeak: false,
      idleSecondsToSpeak: 5,
      allowButtonTrigger: false,
    };
    (globalThis as any).__agentUpdateSettingsMock = vi.fn();
  });

  it('initializes from persisted settings and supports temp updates + save/cancel', () => {
    let saveCb: (() => void) | null = null;
    let cancelCb: (() => void) | null = null;

    const { result } = renderHook(() => useAgentSettings({
      onSave: (cb) => {
        saveCb = cb;
        return () => {};
      },
      onCancel: (cb) => {
        cancelCb = cb;
        return () => {};
      },
    }));

    expect(result.current.settings).toEqual({
      allowProactiveSpeak: false,
      idleSecondsToSpeak: 5,
      allowButtonTrigger: false,
    });

    act(() => {
      result.current.handleAllowProactiveSpeakChange(true);
      result.current.handleIdleSecondsChange(2);
      result.current.handleAllowButtonTriggerChange(true);
    });

    expect(result.current.settings).toEqual({
      allowProactiveSpeak: true,
      idleSecondsToSpeak: 2,
      allowButtonTrigger: true,
    });

    act(() => {
      saveCb?.();
    });

    expect((globalThis as any).__agentUpdateSettingsMock).toHaveBeenCalledWith({
      allowProactiveSpeak: true,
      idleSecondsToSpeak: 2,
      allowButtonTrigger: true,
    });

    act(() => {
      result.current.handleAllowProactiveSpeakChange(false);
    });

    act(() => {
      cancelCb?.();
    });

    expect(result.current.settings).toEqual({
      allowProactiveSpeak: true,
      idleSecondsToSpeak: 2,
      allowButtonTrigger: true,
    });
  });
});
