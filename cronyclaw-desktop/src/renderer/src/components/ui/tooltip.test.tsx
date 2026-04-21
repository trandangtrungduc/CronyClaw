import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Tooltip } from './tooltip';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Tooltip', () => {
  it('renders tooltip content when open', () => {
    wrap(
      <Tooltip content="Tip" portalled={false} open>
        <button type="button">Target</button>
      </Tooltip>,
    );
    expect(screen.getByText('Tip')).not.toBeNull();
  });

  it('does not render tooltip content when disabled', () => {
    wrap(
      <Tooltip content="Tip" portalled={false} disabled>
        <button type="button">Target</button>
      </Tooltip>,
    );
    expect(screen.queryByText('Tip')).toBeNull();
  });
});
