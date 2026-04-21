import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import BrowserPanel from './browser-panel';

const mockUseBrowser = vi.fn();

vi.mock('@/context/browser-context', () => ({
  useBrowser: () => mockUseBrowser(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => `t:${k}` }),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('BrowserPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBrowser.mockImplementation(() => ({
      browserViewData: null as { debuggerFullscreenUrl: string } | null,
    }));
  });

  it('shows empty session copy when browserViewData is null', () => {
    wrap(<BrowserPanel />);
    expect(screen.getByText('t:sidebar.noBrowserSession')).not.toBeNull();
  });

  it('renders iframe when browserViewData is set', () => {
    mockUseBrowser.mockImplementation(() => ({
      browserViewData: { debuggerFullscreenUrl: 'https://example.com/view' },
    }));
    const { container } = wrap(<BrowserPanel />);
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('src')).toBe('https://example.com/view');
    expect(screen.getByText('t:sidebar.browserSession')).not.toBeNull();
  });
});
