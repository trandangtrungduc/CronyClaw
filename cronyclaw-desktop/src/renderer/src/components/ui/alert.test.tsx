import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Alert } from './alert';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Alert', () => {
  it('renders title and description when children are provided', () => {
    wrap(<Alert title="Hello">World</Alert>);
    expect(screen.getByText('Hello')).not.toBeNull();
    expect(screen.getByText('World')).not.toBeNull();
  });

  it('renders startElement over icon', () => {
    wrap(
      <Alert
        title="T"
        icon={<span data-testid="icon-el">I</span>}
        startElement={<span data-testid="start-el">S</span>}
      />,
    );
    expect(screen.getByTestId('start-el')).not.toBeNull();
    expect(screen.queryByTestId('icon-el')).toBeNull();
  });

  it('renders icon when startElement is not provided', () => {
    wrap(<Alert title="T" icon={<span data-testid="icon-el">I</span>} />);
    expect(screen.getByTestId('icon-el')).not.toBeNull();
  });

  it('calls onClose when closable alert close button is clicked', () => {
    const onClose = vi.fn();
    wrap(<Alert title="T" closable onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
