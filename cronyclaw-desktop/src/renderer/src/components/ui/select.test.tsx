import type { ReactNode } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider, defaultSystem, createListCollection } from '@chakra-ui/react';
import {
  SelectRoot,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValueText,
} from './select';
import { useState } from 'react';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Select', () => {
  beforeEach(() => {
    if (typeof (globalThis as any).ResizeObserver === 'undefined') {
      (globalThis as any).ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }
    if (typeof (HTMLElement.prototype as any).scrollTo !== 'function') {
      (HTMLElement.prototype as any).scrollTo = () => {};
    }
  });

  it('shows selected value and updates when an item is picked', async () => {
    const collection = createListCollection({
      items: [
        { label: 'One', value: '1' },
        { label: 'Two', value: '2' },
      ],
    });

    const SelectUnderTest = () => {
      const [value, setValue] = useState<string[]>(['1']);
      return (
        <SelectRoot
          collection={collection}
          value={value}
          onValueChange={(e: any) => setValue(e.value)}
        >
          <SelectTrigger>
            <SelectValueText placeholder="Pick one" />
          </SelectTrigger>
          <SelectContent portalled={false}>
            {collection.items.map((item) => (
              <SelectItem key={item.value} item={item}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      );
    };

    const { container } = wrap(<SelectUnderTest />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).not.toBeNull();
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    const twoOption = await screen.findByRole('option', { name: 'Two' });
    fireEvent.click(twoOption);

    await waitFor(() => {
      const valueText = container.querySelector('[data-part="value-text"]');
      expect(valueText).not.toBeNull();
      expect(valueText!.textContent).toContain('Two');
    });
  });
});
