import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import General from './general';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/hooks/sidebar/setting/use-general-settings', () => ({
  useGeneralSettings: () => ({
    settings: {
      language: ['en'],
      customBgUrl: '',
      selectedBgUrl: [],
      backgroundUrl: '',
      selectedCharacterPreset: [],
      useCameraBackground: false,
      wsUrl: 'ws://localhost',
      baseUrl: 'http://localhost',
      showSubtitle: false,
      imageCompressionQuality: 0.8,
      imageMaxWidth: 0,
      openclawBridgeUrl: 'ws://127.0.0.1:18789',
      openclawBridgeToken: '',
    },
    handleSettingChange: vi.fn(),
    handleCameraToggle: vi.fn(),
    handleCharacterPresetChange: vi.fn(),
    showSubtitle: false,
    setShowSubtitle: vi.fn(),
    checkOpenClawBridge: vi.fn(),
    bridgeStatus: { connected: false, lastError: '', hint: '' },
  }),
}));

vi.mock('@/context/bgurl-context', () => ({
  useBgUrl: () => ({ backgroundFiles: ['bg.png'] }),
}));

vi.mock('@/context/character-config-context', () => ({
  useConfig: () => ({
    confName: 'Char',
    setConfName: vi.fn(),
    configFiles: [{ name: 'Char', filename: 'c.json' }],
  }),
}));

vi.mock('@/context/websocket-context', () => ({
  useWebSocket: () => ({
    wsUrl: 'ws://',
    setWsUrl: vi.fn(),
    baseUrl: 'http://',
    setBaseUrl: vi.fn(),
  }),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('General', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders language and websocket fields', () => {
    wrap(<General />);
    expect(screen.getByText('settings.general.language')).not.toBeNull();
    expect(screen.getByText('settings.general.wsUrl')).not.toBeNull();
    expect(screen.getByText('settings.general.openclawBridgeCheck')).not.toBeNull();
  });
});
