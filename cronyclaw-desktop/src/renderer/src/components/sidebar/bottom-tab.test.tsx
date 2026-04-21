import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import BottomTab from './bottom-tab';

vi.mock('./camera-panel', () => ({
  default: () => <div data-testid="camera-panel" />,
}));
vi.mock('./screen-panel', () => ({
  default: () => <div data-testid="screen-panel" />,
}));
vi.mock('./browser-panel', () => ({
  default: () => <div data-testid="browser-panel" />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => `t:${k}` }),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('BottomTab', () => {
  it('renders tab labels and panel placeholders', async () => {
    await act(async () => {
      wrap(<BottomTab />);
    });
    expect(screen.getByText('t:sidebar.camera')).not.toBeNull();
    expect(screen.getByText('t:sidebar.screen')).not.toBeNull();
    expect(screen.getByText('t:sidebar.browser')).not.toBeNull();
    expect(screen.getByTestId('camera-panel')).not.toBeNull();
    expect(screen.getByTestId('screen-panel')).not.toBeNull();
    expect(screen.getByTestId('browser-panel')).not.toBeNull();
  });
});
