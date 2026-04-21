import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { GroupProvider, useGroup } from './group-context';

function Consumer() {
  const {
    selfUid,
    groupMembers,
    isOwner,
    sortedGroupMembers,
    setSelfUid,
    setGroupMembers,
    setIsOwner,
    resetGroupState,
  } = useGroup();

  return (
    <div>
      <span data-testid="selfUid">{selfUid}</span>
      <span data-testid="members">{groupMembers.join(',')}</span>
      <span data-testid="sorted">{sortedGroupMembers.join(',')}</span>
      <span data-testid="isOwner">{String(isOwner)}</span>
      <button type="button" onClick={() => setSelfUid('me')}>
        setSelf
      </button>
      <button
        type="button"
        onClick={() => setGroupMembers(['x', 'me', 'y'])}
      >
        setMembers
      </button>
      <button type="button" onClick={() => setIsOwner(true)}>
        setOwner
      </button>
      <button type="button" onClick={() => resetGroupState()}>
        reset
      </button>
    </div>
  );
}

describe('GroupContext', () => {
  it('sorts selfUid first and supports reset', () => {
    const { rerender } = render(
      <ChakraProvider value={defaultSystem}>
        <GroupProvider>
          <Consumer />
        </GroupProvider>
      </ChakraProvider>,
    );

    expect(screen.getByTestId('selfUid').textContent).toBe('');
    expect(screen.getByTestId('members').textContent).toBe('');
    expect(screen.getByTestId('sorted').textContent).toBe('');
    expect(screen.getByTestId('isOwner').textContent).toBe('false');

    fireEvent.click(screen.getByText('setSelf'));
    fireEvent.click(screen.getByText('setMembers'));
    fireEvent.click(screen.getByText('setOwner'));

    expect(screen.getByTestId('selfUid').textContent).toBe('me');
    expect(screen.getByTestId('members').textContent).toBe('x,me,y');
    expect(screen.getByTestId('sorted').textContent).toBe('me,x,y');
    expect(screen.getByTestId('isOwner').textContent).toBe('true');

    fireEvent.click(screen.getByText('reset'));
    expect(screen.getByTestId('members').textContent).toBe('');
    expect(screen.getByTestId('sorted').textContent).toBe('');
    expect(screen.getByTestId('isOwner').textContent).toBe('false');

    rerender(
      <ChakraProvider value={defaultSystem}>
        <GroupProvider>
          <Consumer />
        </GroupProvider>
      </ChakraProvider>,
    );
  });
});
