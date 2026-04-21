import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem, createListCollection } from '@chakra-ui/react';
import { SelectField, SwitchField } from './common';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('setting common fields', () => {
  it('SelectField shows label', () => {
    const collection = createListCollection({
      items: [{ label: 'One', value: '1' }],
    });
    wrap(
      <SelectField
        label="Pick"
        value={['1']}
        onChange={vi.fn()}
        collection={collection}
        placeholder="p"
      />,
    );
    expect(screen.getByText('Pick')).not.toBeNull();
  });

  it('SwitchField shows label', () => {
    wrap(
      <SwitchField
        label="Enable"
        checked={false}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Enable')).not.toBeNull();
  });
});
