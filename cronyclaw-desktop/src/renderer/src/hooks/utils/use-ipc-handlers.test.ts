import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIpcHandlers } from './use-ipc-handlers';

vi.mock('@/hooks/utils/use-mic-toggle', () => ({
  useMicToggle: () => ({
    handleMicToggle: (...args: any[]) => (globalThis as any).__ipcHandleMicToggleMock(...args),
  }),
}));

vi.mock('@/components/canvas/live2d', () => ({
  useInterrupt: () => ({
    interrupt: (...args: any[]) => (globalThis as any).__ipcInterruptMock(...args),
  }),
}));

vi.mock('@/context/live2d-config-context', () => ({
  useLive2DConfig: () => ({
    modelInfo: (globalThis as any).__ipcModelInfo,
    setModelInfo: (...args: any[]) => (globalThis as any).__ipcSetModelInfoMock(...args),
  }),
}));

vi.mock('@/hooks/utils/use-switch-character', () => ({
  useSwitchCharacter: () => ({
    switchCharacter: (...args: any[]) => (globalThis as any).__ipcSwitchCharacterMock(...args),
  }),
}));

vi.mock('@/hooks/utils/use-force-ignore-mouse', () => ({
  useForceIgnoreMouse: () => ({
    setForceIgnoreMouse: (...args: any[]) => (globalThis as any).__ipcSetForceIgnoreMouseMock(...args),
  }),
}));

vi.mock('@/context/mode-context', () => ({
  useMode: () => ({
    mode: (globalThis as any).__ipcModeValue,
    setMode: vi.fn(),
    isElectron: false,
  }),
}));

describe('useIpcHandlers', () => {
  beforeEach(() => {
    (globalThis as any).__ipcHandleMicToggleMock = vi.fn();
    (globalThis as any).__ipcInterruptMock = vi.fn();
    (globalThis as any).__ipcSetModelInfoMock = vi.fn();
    (globalThis as any).__ipcSwitchCharacterMock = vi.fn();
    (globalThis as any).__ipcSetForceIgnoreMouseMock = vi.fn();

    (globalThis as any).__ipcModeValue = 'pet';
    (globalThis as any).__ipcModelInfo = {
      url: 'u',
      kScale: 0.5,
      initialXshift: 0,
      initialYshift: 0,
      emotionMap: {},
      pointerInteractive: true,
      scrollToResize: false,
    };
  });

  it('registers ipc listeners in pet mode and wires handlers to context + window.api', () => {
    const ipcHandlers: Record<string, any> = {};
    const onMock = vi.fn((event: string, cb: any) => {
      ipcHandlers[event] = cb;
    });
    const removeAllListenersMock = vi.fn();

    (window as any).electron = {
      ipcRenderer: {
        on: onMock,
        removeAllListeners: removeAllListenersMock,
      },
    };

    const toggleSpy = vi.spyOn(window.api as any, 'toggleForceIgnoreMouse');

    renderHook(() => useIpcHandlers());

    expect(removeAllListenersMock).toHaveBeenCalledWith('mic-toggle');
    expect(onMock).toHaveBeenCalledWith('mic-toggle', expect.any(Function));
    expect(onMock).toHaveBeenCalledWith('interrupt', expect.any(Function));
    expect(onMock).toHaveBeenCalledWith('toggle-scroll-to-resize', expect.any(Function));
    expect(onMock).toHaveBeenCalledWith('switch-character', expect.any(Function));
    expect(onMock).toHaveBeenCalledWith('toggle-force-ignore-mouse', expect.any(Function));
    expect(onMock).toHaveBeenCalledWith('force-ignore-mouse-changed', expect.any(Function));

    ipcHandlers['mic-toggle']?.({} as any);
    expect((globalThis as any).__ipcHandleMicToggleMock).toHaveBeenCalledTimes(1);

    ipcHandlers['interrupt']?.({} as any);
    expect((globalThis as any).__ipcInterruptMock).toHaveBeenCalledTimes(1);

    ipcHandlers['toggle-scroll-to-resize']?.({} as any);
    expect((globalThis as any).__ipcSetModelInfoMock).toHaveBeenCalledWith({
      ...(globalThis as any).__ipcModelInfo,
      scrollToResize: true,
    });

    ipcHandlers['switch-character']?.({} as any, 'hero.json');
    expect((globalThis as any).__ipcSwitchCharacterMock).toHaveBeenCalledWith('hero.json');

    ipcHandlers['force-ignore-mouse-changed']?.({} as any, true);
    expect((globalThis as any).__ipcSetForceIgnoreMouseMock).toHaveBeenCalledWith(true);

    ipcHandlers['toggle-force-ignore-mouse']?.();
    expect(toggleSpy).toHaveBeenCalledTimes(1);
  });

  it('does not register listeners when not in pet mode', () => {
    (globalThis as any).__ipcModeValue = 'window';
    const onMock = vi.fn();
    const removeAllListenersMock = vi.fn();

    (window as any).electron = {
      ipcRenderer: {
        on: onMock,
        removeAllListeners: removeAllListenersMock,
      },
    };

    renderHook(() => useIpcHandlers());

    expect(onMock).not.toHaveBeenCalled();
    expect(removeAllListenersMock).not.toHaveBeenCalled();
  });
});
