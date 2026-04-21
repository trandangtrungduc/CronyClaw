import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { NumberInputRoot, NumberInputField } from './number-input';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('NumberInputRoot', () => {
  it('updates input value on change', () => {
    wrap(
      <NumberInputRoot defaultValue="1">
        <NumberInputField aria-label="number" />
      </NumberInputRoot>,
    );

    const input = screen.getByLabelText('number') as HTMLInputElement;
    expect(input.value).toBe('1');

    fireEvent.change(input, { target: { value: '5' } });
    expect(input.value).toBe('5');
  });
});
