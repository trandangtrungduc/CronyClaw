import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem, InputElement } from '@chakra-ui/react';
import { InputGroup } from './input-group';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('InputGroup', () => {
  it('renders startElement and endElement around the input', () => {
    wrap(
      <InputGroup startElement="START" endElement="END">
        <InputElement aria-label="group-input" />
      </InputGroup>,
    );

    expect(screen.getByText('START')).not.toBeNull();
    expect(screen.getByText('END')).not.toBeNull();
    expect(screen.getByLabelText('group-input')).not.toBeNull();
  });
});
