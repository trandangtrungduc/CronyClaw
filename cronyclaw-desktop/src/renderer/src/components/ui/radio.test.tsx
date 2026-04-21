import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { RadioGroup, Radio } from './radio';
import { useState } from 'react';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Radio', () => {
  it('selects the clicked radio option', () => {
    const Wrapper = () => {
      const [value, setValue] = useState('a');
      return (
        <RadioGroup
          value={value}
          onValueChange={(details: any) => setValue(details.value ?? details)}
        >
          <Radio value="a">Option A</Radio>
          <Radio value="b">Option B</Radio>
        </RadioGroup>
      );
    };

    const { container } = wrap(<Wrapper />);

    const getRadio = (val: string) => {
      const radios = Array.from(container.querySelectorAll('input[type="radio"]'));
      return radios.find((r) => (r as HTMLInputElement).value === val) as HTMLInputElement | undefined;
    };

    const inputA = getRadio('a');
    const inputB = getRadio('b');
    expect(inputA).not.toBeNull();
    expect(inputB).not.toBeNull();
    expect(inputA!.checked).toBe(true);
    expect(inputB!.checked).toBe(false);

    const optionB = screen.getByText('Option B');
    fireEvent.click(optionB);
    expect(inputA!.checked).toBe(false);
    expect(inputB!.checked).toBe(true);
  });
});
