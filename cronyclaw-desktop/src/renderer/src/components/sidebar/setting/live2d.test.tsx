import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import Live2D from './live2d';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => `t:${k}` }),
}));

const mockUseLive2dSettings = vi.fn();

vi.mock('@/hooks/sidebar/setting/use-live2d-settings', () => ({
  useLive2dSettings: () => mockUseLive2dSettings(),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Live2D settings tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLive2dSettings.mockImplementation(() => ({
      modelInfo: { pointerInteractive: false, scrollToResize: true },
      handleInputChange: vi.fn(),
      handleSave: vi.fn(),
      handleCancel: vi.fn(),
    }));
  });

  it('renders switch labels', () => {
    wrap(<Live2D />);
    expect(screen.getByText('t:settings.live2d.pointerInteractive')).not.toBeNull();
    expect(screen.getByText('t:settings.live2d.scrollToResize')).not.toBeNull();
  });
});
