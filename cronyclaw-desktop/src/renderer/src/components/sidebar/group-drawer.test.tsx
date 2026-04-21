import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import GroupDrawer from './group-drawer';

vi.mock('@/context/group-context', () => ({
  useGroup: () => ({
    selfUid: 'self-1',
    sortedGroupMembers: ['self-1', 'other-2'],
    isOwner: true,
  }),
}));

const mockUseGroupDrawer = vi.fn();

vi.mock('@/hooks/sidebar/use-group-drawer', () => ({
  useGroupDrawer: () => mockUseGroupDrawer(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => `t:${k}` }),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('GroupDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGroupDrawer.mockImplementation(() => ({
      isOpen: false,
      setIsOpen: vi.fn(),
      inviteUid: '',
      setInviteUid: vi.fn(),
      handleInvite: vi.fn(),
      handleRemove: vi.fn(),
      handleLeaveGroup: vi.fn(),
      requestGroupInfo: vi.fn(),
    }));
  });

  it('renders trigger', () => {
    wrap(
      <GroupDrawer>
        <button type="button">group</button>
      </GroupDrawer>,
    );
    expect(screen.getByText('group')).not.toBeNull();
  });

  it('shows management title when open', () => {
    mockUseGroupDrawer.mockImplementation(() => ({
      isOpen: true,
      setIsOpen: vi.fn(),
      inviteUid: '',
      setInviteUid: vi.fn(),
      handleInvite: vi.fn(),
      handleRemove: vi.fn(),
      handleLeaveGroup: vi.fn(),
      requestGroupInfo: vi.fn(),
    }));
    wrap(
      <GroupDrawer>
        <span>t</span>
      </GroupDrawer>,
    );
    expect(screen.getByText('t:group.management')).not.toBeNull();
    expect(screen.getByText('self-1')).not.toBeNull();
  });
});
