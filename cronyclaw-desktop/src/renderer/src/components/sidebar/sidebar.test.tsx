import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import Sidebar from './sidebar';

const mockUseSidebar = vi.fn();

vi.mock('@/hooks/sidebar/use-sidebar', () => ({
  useSidebar: () => mockUseSidebar(),
}));

vi.mock('./chat-history-panel', () => ({
  default: () => <div data-testid="chat-history-panel" />,
}));
vi.mock('./bottom-tab', () => ({
  default: () => <div data-testid="bottom-tab" />,
}));
vi.mock('./setting/setting-ui', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="setting-ui" /> : null,
}));
vi.mock('./group-drawer', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="group-drawer">{children}</div>
  ),
}));
vi.mock('./history-drawer', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="history-drawer">{children}</div>
  ),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Sidebar', () => {
  const onToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSidebar.mockImplementation(() => ({
      settingsOpen: false,
      onSettingsOpen: vi.fn(),
      onSettingsClose: vi.fn(),
      createNewHistory: vi.fn(),
      setMode: vi.fn(),
      currentMode: 'window' as const,
      isElectron: true,
    }));
  });

  it('renders main content when expanded and settings closed', () => {
    wrap(<Sidebar isCollapsed={false} onToggle={onToggle} />);
    expect(screen.getByTestId('chat-history-panel')).not.toBeNull();
    expect(screen.getByTestId('bottom-tab')).not.toBeNull();
    expect(screen.queryByTestId('setting-ui')).toBeNull();
  });

  it('renders settings instead of chat when settingsOpen', () => {
    mockUseSidebar.mockImplementation(() => ({
      settingsOpen: true,
      onSettingsOpen: vi.fn(),
      onSettingsClose: vi.fn(),
      createNewHistory: vi.fn(),
      setMode: vi.fn(),
      currentMode: 'window' as const,
      isElectron: true,
    }));
    wrap(<Sidebar isCollapsed={false} onToggle={onToggle} />);
    expect(screen.getByTestId('setting-ui')).not.toBeNull();
    expect(screen.queryByTestId('chat-history-panel')).toBeNull();
  });

  it('hides content when collapsed', () => {
    wrap(<Sidebar isCollapsed onToggle={onToggle} />);
    expect(screen.queryByTestId('chat-history-panel')).toBeNull();
    expect(screen.queryByTestId('bottom-tab')).toBeNull();
  });

  it('calls onToggle when collapse chevron is clicked', () => {
    const { container } = wrap(<Sidebar isCollapsed={false} onToggle={onToggle} />);
    const firstSvg = container.querySelector('svg');
    expect(firstSvg).toBeTruthy();
    fireEvent.click(firstSvg!.parentElement!);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
