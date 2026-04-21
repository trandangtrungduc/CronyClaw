import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Avatar } from './avatar';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Avatar', () => {
  it('renders initials when name is provided', () => {
    wrap(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).not.toBeNull();
  });

  it('renders fallback icon markup when name is omitted', () => {
    const { container } = wrap(
      <Avatar icon={<span>ICON</span>} />,
    );
    expect(screen.queryByText('ICON')).toBeNull();
    expect(container.querySelector('path')).not.toBeNull();
  });

  it('prefers name initials over icon when both are provided', () => {
    wrap(
      <Avatar
        name="John Doe"
        icon={<span data-testid="icon-el">X</span>}
      />,
    );
    expect(screen.getByText('JD')).not.toBeNull();
    expect(screen.queryByTestId('icon-el')).toBeNull();
  });
});
