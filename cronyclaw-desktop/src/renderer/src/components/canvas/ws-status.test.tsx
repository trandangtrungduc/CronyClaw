import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import WebSocketStatus from './ws-status';

const mockUseWSStatus = vi.fn(() => ({
  color: 'green.500',
  textKey: 'wsStatus.connected',
  handleClick: vi.fn(),
  isDisconnected: false,
}));

vi.mock('@/hooks/canvas/use-ws-status', () => ({
  useWSStatus: () => mockUseWSStatus(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => `t:${k}` }),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('WebSocketStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWSStatus.mockImplementation(() => ({
      color: 'green.500',
      textKey: 'wsStatus.connected',
      handleClick: vi.fn(),
      isDisconnected: false,
    }));
  });

  it('renders translated status key', () => {
    wrap(<WebSocketStatus />);
    expect(screen.queryByText('t:wsStatus.connected')).not.toBeNull();
  });

  it('invokes handleClick when disconnected and clicked', () => {
    const handleClick = vi.fn();
    mockUseWSStatus.mockImplementation(() => ({
      color: 'red.500',
      textKey: 'wsStatus.clickToReconnect',
      handleClick,
      isDisconnected: true,
    }));
    wrap(<WebSocketStatus />);
    fireEvent.click(screen.getByText('t:wsStatus.clickToReconnect'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
