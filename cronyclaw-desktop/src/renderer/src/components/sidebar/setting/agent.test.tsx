import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import Agent from './agent';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => `t:${k}` }),
}));

const mockUseAgentSettings = vi.fn();

vi.mock('@/hooks/sidebar/setting/use-agent-settings', () => ({
  useAgentSettings: () => mockUseAgentSettings(),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Agent settings tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAgentSettings.mockImplementation(() => ({
      settings: {
        allowProactiveSpeak: false,
        idleSecondsToSpeak: 5,
        allowButtonTrigger: true,
      },
      handleAllowProactiveSpeakChange: vi.fn(),
      handleIdleSecondsChange: vi.fn(),
      handleAllowButtonTriggerChange: vi.fn(),
    }));
  });

  it('renders proactive speak switch', () => {
    wrap(<Agent />);
    expect(screen.getByText('t:settings.agent.allowProactiveSpeak')).not.toBeNull();
  });
});
