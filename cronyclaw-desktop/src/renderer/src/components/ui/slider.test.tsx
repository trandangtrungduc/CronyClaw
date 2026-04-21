import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Slider } from './slider';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Slider', () => {
  it('renders label and mark labels', () => {
    const marks = [
      { value: 0, label: 'Min' },
      { value: 50, label: 'Mid' },
      { value: 100, label: 'Max' },
    ];

    const { container } = wrap(
      <Slider defaultValue={[50]} marks={marks} label="Volume" showValue />,
    );

    expect(screen.getByText('Volume')).not.toBeNull();
    expect(screen.getByText('Min')).not.toBeNull();
    expect(screen.getByText('Mid')).not.toBeNull();
    expect(screen.getByText('Max')).not.toBeNull();
    expect(container.textContent).toContain('50');
  });
});
