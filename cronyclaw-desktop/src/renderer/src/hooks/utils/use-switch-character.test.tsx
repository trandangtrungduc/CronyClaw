import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwitchCharacter } from './use-switch-character';

vi.mock('@/context/websocket-context', () => ({
  useWebSocket: () => ({
    sendMessage: (...args: any[]) => (globalThis as any).__switchCharacterSendMessageMock(...args),
  }),
}));

vi.mock('@/context/character-config-context', () => ({
  useConfig: () => ({
    confName: (globalThis as any).__switchCharacterConfName,
    getFilenameByName: (...args: any[]) => (globalThis as any).__switchCharacterGetFilenameByNameMock(...args),
  }),
}));

vi.mock('@/components/canvas/live2d', () => ({
  useInterrupt: () => ({
    interrupt: (...args: any[]) => (globalThis as any).__switchCharacterInterruptMock(...args),
  }),
}));

vi.mock('@/context/vad-context', () => ({
  useVAD: () => ({
    stopMic: (...args: any[]) => (globalThis as any).__switchCharacterStopMicMock(...args),
  }),
}));

vi.mock('@/context/subtitle-context', () => ({
  useSubtitle: () => ({
    setSubtitleText: (...args: any[]) => (globalThis as any).__switchCharacterSetSubtitleTextMock(...args),
  }),
}));

vi.mock('@/context/ai-state-context', () => ({
  useAiState: () => ({
    setAiState: (...args: any[]) => (globalThis as any).__switchCharacterSetAiStateMock(...args),
  }),
}));

vi.mock('@/context/live2d-config-context', () => ({
  useLive2DConfig: () => ({
    setModelInfo: (...args: any[]) => (globalThis as any).__switchCharacterSetModelInfoMock(...args),
  }),
}));

describe('useSwitchCharacter', () => {
  beforeEach(() => {
    (globalThis as any).__switchCharacterSendMessageMock = vi.fn();
    (globalThis as any).__switchCharacterGetFilenameByNameMock = vi.fn();
    (globalThis as any).__switchCharacterInterruptMock = vi.fn();
    (globalThis as any).__switchCharacterStopMicMock = vi.fn();
    (globalThis as any).__switchCharacterSetSubtitleTextMock = vi.fn();
    (globalThis as any).__switchCharacterSetAiStateMock = vi.fn();
    (globalThis as any).__switchCharacterSetModelInfoMock = vi.fn();
    (globalThis as any).__switchCharacterConfName = 'conf-1';

    (globalThis as any).__switchCharacterGetFilenameByNameMock = vi
      .fn()
      .mockReturnValue('current.json');
  });

  it('does nothing when switching to the currently loaded file', () => {
    const { result } = renderHook(() => useSwitchCharacter());

    act(() => {
      result.current.switchCharacter('current.json');
    });

    expect((globalThis as any).__switchCharacterSetSubtitleTextMock).not.toHaveBeenCalled();
    expect((globalThis as any).__switchCharacterInterruptMock).not.toHaveBeenCalled();
    expect((globalThis as any).__switchCharacterStopMicMock).not.toHaveBeenCalled();
    expect((globalThis as any).__switchCharacterSetAiStateMock).not.toHaveBeenCalled();
    expect((globalThis as any).__switchCharacterSetModelInfoMock).not.toHaveBeenCalled();
    expect((globalThis as any).__switchCharacterSendMessageMock).not.toHaveBeenCalled();
  });

  it('switches character: subtitle, interrupt, stop mic, ai state, clear model, send websocket message', () => {
    const { result } = renderHook(() => useSwitchCharacter());

    act(() => {
      result.current.switchCharacter('other.json');
    });

    expect((globalThis as any).__switchCharacterSetSubtitleTextMock).toHaveBeenCalledWith('New Character Loading...');
    expect((globalThis as any).__switchCharacterInterruptMock).toHaveBeenCalledTimes(1);
    expect((globalThis as any).__switchCharacterStopMicMock).toHaveBeenCalledTimes(1);
    expect((globalThis as any).__switchCharacterSetAiStateMock).toHaveBeenCalledWith('loading');
    expect((globalThis as any).__switchCharacterSetModelInfoMock).toHaveBeenCalledWith(undefined);

    expect((globalThis as any).__switchCharacterSendMessageMock).toHaveBeenCalledWith({
      type: 'switch-config',
      file: 'other.json',
    });
  });
});
