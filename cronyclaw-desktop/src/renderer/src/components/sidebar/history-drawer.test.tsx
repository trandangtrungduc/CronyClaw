import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import HistoryDrawer from './history-drawer';

const mockUseHistoryDrawer = vi.fn();

vi.mock('@/hooks/sidebar/use-history-drawer', () => ({
  useHistoryDrawer: () => mockUseHistoryDrawer(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => `t:${k}` }),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('HistoryDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseHistoryDrawer.mockImplementation(() => ({
      open: false,
      setOpen: vi.fn(),
      historyList: [],
      currentHistoryUid: null as string | null,
      fetchAndSetHistory: vi.fn(),
      deleteHistory: vi.fn(),
      getLatestMessageContent: () => ({ content: '', timestamp: null as string | null }),
    }));
  });

  it('renders trigger children', () => {
    wrap(
      <HistoryDrawer>
        <button type="button">open-history</button>
      </HistoryDrawer>,
    );
    expect(screen.getByText('open-history')).not.toBeNull();
  });

  it('lists history titles when hook supplies entries', () => {
    mockUseHistoryDrawer.mockImplementation(() => ({
      open: true,
      setOpen: vi.fn(),
      historyList: [
        {
          uid: 'u1',
          latest_message: {
            role: 'human' as const,
            content: 'Last line',
            timestamp: '2026-04-02T12:00:00.000Z',
          },
          timestamp: '2026-04-02T12:00:00.000Z',
        },
      ],
      currentHistoryUid: 'u1',
      fetchAndSetHistory: vi.fn(),
      deleteHistory: vi.fn(),
      getLatestMessageContent: () => ({
        content: 'Last line',
        timestamp: '2026-04-02T12:00:00.000Z',
      }),
    }));
    wrap(
      <HistoryDrawer>
        <span>trigger</span>
      </HistoryDrawer>,
    );
    expect(screen.getByText('t:history.chatHistoryList')).not.toBeNull();
    expect(screen.getByText('Last line')).not.toBeNull();
  });
});
