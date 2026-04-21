import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeneralSettings } from './use-general-settings';

vi.mock('i18next', () => ({
  default: {
    language: 'en',
    changeLanguage: (lng: string) => {
      (globalThis as any).__changeLanguageMock?.(lng);
    },
  },
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(),
  },
}));

vi.mock('@/context/subtitle-context', () => ({
  useSubtitle: () => ({
    showSubtitle: (globalThis as any).__showSubtitleValue,
    setShowSubtitle: (globalThis as any).__setShowSubtitleMock,
  }),
}));

vi.mock('@/context/camera-context', () => ({
  useCamera: () => ({
    startBackgroundCamera: (globalThis as any).__startBackgroundCameraMock,
    stopBackgroundCamera: (globalThis as any).__stopBackgroundCameraMock,
  }),
}));

vi.mock('@/hooks/utils/use-switch-character', () => ({
  useSwitchCharacter: () => ({
    switchCharacter: (globalThis as any).__switchCharacterMock,
  }),
}));

vi.mock('@/context/character-config-context', () => ({
  useConfig: () => ({
    configFiles: (globalThis as any).__configFiles,
    getFilenameByName: (globalThis as any).__getFilenameByNameMock,
  }),
}));

describe('useGeneralSettings', () => {
  beforeEach(() => {
    (globalThis as any).__changeLanguageMock = vi.fn();
    (globalThis as any).__showSubtitleValue = true;
    (globalThis as any).__setShowSubtitleMock = vi.fn();
    (globalThis as any).__startBackgroundCameraMock = vi.fn().mockResolvedValue(undefined);
    (globalThis as any).__stopBackgroundCameraMock = vi.fn();
    (globalThis as any).__switchCharacterMock = vi.fn();
    (globalThis as any).__configFiles = [{ filename: 'hero.json' }];
    (globalThis as any).__getFilenameByNameMock = vi.fn().mockReturnValue('hero.json');

    vi.useFakeTimers();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        status: { connected: true, last_error: '', },
      }),
    }) as any;

    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {}) as any;
  });

  it('initializes settings from bgUrlContext + confName and applies ws/base callbacks', async () => {
    const setConfNameMock = vi.fn();
    const onWsUrlChange = vi.fn();
    const onBaseUrlChange = vi.fn();

    const bgUrlContext = {
      backgroundUrl: 'http://127.0.0.1/bg/test.jpg',
      useCameraBackground: true,
      setBackgroundUrl: vi.fn(),
      setUseCameraBackground: vi.fn(),
    };

    const { result } = renderHook(() => useGeneralSettings({
      bgUrlContext,
      confName: 'hero1',
      setConfName: setConfNameMock,
      baseUrl: 'http://127.0.0.1',
      wsUrl: 'ws://example/ws',
      onWsUrlChange,
      onBaseUrlChange,
    }));

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    expect(result.current.settings.language[0]).toBe('en');
    expect(result.current.settings.backgroundUrl).toBe('http://127.0.0.1/bg/test.jpg');
    expect(result.current.settings.selectedBgUrl).toEqual(['/bg/test.jpg']);
    expect(result.current.settings.selectedCharacterPreset).toEqual(['hero.json']);
    expect(result.current.settings.useCameraBackground).toBe(true);

    expect(onWsUrlChange).toHaveBeenCalledWith('ws://example/ws');
    expect(onBaseUrlChange).toHaveBeenCalledWith('http://127.0.0.1');
    expect((globalThis as any).__setShowSubtitleMock).toHaveBeenCalledWith(true);
  });

  it('handleSettingChange updates wsUrl/baseUrl/language and handleCancel restores camera state', async () => {
    const setConfNameMock = vi.fn();
    const onWsUrlChange = vi.fn();
    const onBaseUrlChange = vi.fn();

    const bgUrlContext = {
      backgroundUrl: 'http://127.0.0.1/bg/test.jpg',
      useCameraBackground: true,
      setBackgroundUrl: vi.fn(),
      setUseCameraBackground: vi.fn(),
    };

    const { result } = renderHook(() => useGeneralSettings({
      bgUrlContext,
      confName: 'hero1',
      setConfName: setConfNameMock,
      baseUrl: 'http://127.0.0.1',
      wsUrl: 'ws://example/ws',
      onWsUrlChange,
      onBaseUrlChange,
    }));

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    await act(async () => {
      result.current.handleSettingChange('wsUrl', 'ws://new/ws' as any);
      result.current.handleSettingChange('baseUrl', 'http://new' as any);
      result.current.handleSettingChange('language', ['ja'] as any);
      result.current.handleSettingChange('useCameraBackground', false as any);
      await Promise.resolve();
    });

    expect(onWsUrlChange).toHaveBeenCalledWith('ws://new/ws');
    expect(onBaseUrlChange).toHaveBeenCalledWith('http://new');
    expect((globalThis as any).__changeLanguageMock).toHaveBeenCalledWith('ja');
    expect(result.current.settings.useCameraBackground).toBe(false);

    act(() => {
      result.current.handleCancel();
    });

    expect(bgUrlContext.setUseCameraBackground).toHaveBeenCalledWith(true);
    expect((globalThis as any).__startBackgroundCameraMock).toHaveBeenCalled();
    expect(setConfNameMock).toHaveBeenCalledWith('hero1');
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
