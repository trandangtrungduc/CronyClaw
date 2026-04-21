import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import ASR from './asr';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => `t:${k}` }),
}));

const mockUseASRSettings = vi.fn();

vi.mock('@/hooks/sidebar/setting/use-asr-settings', () => ({
  useASRSettings: () => mockUseASRSettings(),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('ASR settings tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseASRSettings.mockImplementation(() => ({
      localSettings: {
        positiveSpeechThreshold: 50,
        negativeSpeechThreshold: 35,
        redemptionFrames: 35,
      },
      autoStopMic: false,
      autoStartMicOn: false,
      autoStartMicOnConvEnd: false,
      setAutoStopMic: vi.fn(),
      setAutoStartMicOn: vi.fn(),
      setAutoStartMicOnConvEnd: vi.fn(),
      handleInputChange: vi.fn(),
      handleSave: vi.fn(),
      handleCancel: vi.fn(),
    }));
  });

  it('renders mic toggle copy', () => {
    wrap(<ASR />);
    expect(screen.getByText('t:settings.asr.autoStopMic')).not.toBeNull();
  });
});
