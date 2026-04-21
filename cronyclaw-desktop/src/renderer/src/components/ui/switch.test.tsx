import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Switch } from './switch';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Switch', () => {
  it('renders label and toggles checked state when clicked', () => {
    const { container } = wrap(<Switch>Toggle</Switch>);
    const labelEl = screen.getByText('Toggle');
    expect(labelEl).not.toBeNull();

    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    expect(input!.checked).toBe(false);

    fireEvent.click(labelEl);
    expect(input!.checked).toBe(true);
  });
});
