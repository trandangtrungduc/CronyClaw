import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Checkbox } from './checkbox';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Checkbox', () => {
  it('renders a labeled checkbox', () => {
    wrap(<Checkbox>My checkbox</Checkbox>);
    const labelEl = screen.getByText('My checkbox');
    expect(labelEl).not.toBeNull();
  });

  it('toggles aria-checked when clicked (uncontrolled)', () => {
    const { container } = wrap(
      <Checkbox defaultChecked={false}>Toggle me</Checkbox>,
    );
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    expect(input!.checked).toBe(false);
    fireEvent.click(screen.getByText('Toggle me'));
    expect(input!.checked).toBe(true);
  });

  it('calls Chakra onCheckedChange when toggled', () => {
    const onChange = vi.fn();
    wrap(
      <Checkbox
        defaultChecked={false}
        onChange={onChange}
      >
        Toggle
      </Checkbox>,
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(onChange).toHaveBeenCalled();
  });
});
