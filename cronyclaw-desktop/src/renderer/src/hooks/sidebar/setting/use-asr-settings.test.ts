import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useASRSettings } from './use-asr-settings';

vi.mock('@/context/vad-context', () => ({
  useVAD: () => ({
    settings: (globalThis as any).__vadSettings,
    updateSettings: (globalThis as any).__vadUpdateSettingsMock,
    autoStopMic: (globalThis as any).__autoStopMicValue,
    setAutoStopMic: (globalThis as any).__setAutoStopMicMock,
    autoStartMicOn: (globalThis as any).__autoStartMicOnValue,
    setAutoStartMicOn: (globalThis as any).__setAutoStartMicOnMock,
    autoStartMicOnConvEnd: (globalThis as any).__autoStartMicOnConvEndValue,
    setAutoStartMicOnConvEnd: (globalThis as any).__setAutoStartMicOnConvEndMock,
  }),
}));

describe('useASRSettings', () => {
  beforeEach(() => {
    (globalThis as any).__vadSettings = {
      positiveSpeechThreshold: 50,
      negativeSpeechThreshold: 35,
      redemptionFrames: 35,
    };
    (globalThis as any).__vadUpdateSettingsMock = vi.fn();
    (globalThis as any).__autoStopMicValue = false;
    (globalThis as any).__autoStartMicOnValue = false;
    (globalThis as any).__autoStartMicOnConvEndValue = false;
    (globalThis as any).__setAutoStopMicMock = vi.fn();
    (globalThis as any).__setAutoStartMicOnMock = vi.fn();
    (globalThis as any).__setAutoStartMicOnConvEndMock = vi.fn();
  });

  it('initializes local values from VAD context and supports input changes + save/cancel', () => {
    const { result } = renderHook(() => useASRSettings());

    expect(result.current.localSettings).toEqual({
      positiveSpeechThreshold: 50,
      negativeSpeechThreshold: 35,
      redemptionFrames: 35,
    });
    expect(result.current.autoStopMic).toBe(false);
    expect(result.current.autoStartMicOn).toBe(false);
    expect(result.current.autoStartMicOnConvEnd).toBe(false);

    act(() => {
      result.current.setAutoStopMic(true);
    });
    expect(result.current.autoStopMic).toBe(true);
    expect((globalThis as any).__setAutoStopMicMock).toHaveBeenCalledWith(true);

    act(() => {
      result.current.handleInputChange('positiveSpeechThreshold', '42');
    });
    expect(result.current.localSettings.positiveSpeechThreshold).toBe(42);

    act(() => {
      result.current.handleInputChange('negativeSpeechThreshold', '-');
    });
    expect(result.current.localSettings.negativeSpeechThreshold).toBe('-');

    act(() => {
      result.current.handleSave();
    });

    expect((globalThis as any).__vadUpdateSettingsMock).toHaveBeenCalledWith({
      positiveSpeechThreshold: 42,
      negativeSpeechThreshold: '-',
      redemptionFrames: 35,
    });

    act(() => {
      result.current.setAutoStopMic(false);
      result.current.handleInputChange('positiveSpeechThreshold', '12');
    });

    act(() => {
      result.current.handleCancel();
    });

    expect(result.current.autoStopMic).toBe(true);
    expect(result.current.localSettings.positiveSpeechThreshold).toBe(42);
    expect(result.current.localSettings.negativeSpeechThreshold).toBe('-');
    expect((globalThis as any).__setAutoStopMicMock).toHaveBeenLastCalledWith(true);
  });
});
