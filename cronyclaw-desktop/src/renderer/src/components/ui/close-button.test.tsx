import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { CloseButton } from './close-button';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('CloseButton', () => {
  it('renders a close button with aria-label Close', () => {
    wrap(<CloseButton />);
    expect(screen.getByRole('button', { name: 'Close' })).not.toBeNull();
  });

  it('renders children instead of default icon', () => {
    wrap(<CloseButton>X</CloseButton>);
    expect(screen.getByRole('button', { name: 'Close' })).not.toBeNull();
    expect(screen.getByText('X')).not.toBeNull();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    wrap(<CloseButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
