import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Field } from './field';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Field', () => {
  it('renders label, helperText, and errorText', () => {
    wrap(
      <Field
        label="My label"
        helperText="Helper message"
        errorText="Error message"
        invalid
      >
        <input aria-label="field-input" />
      </Field>,
    );

    expect(screen.getByText('My label')).not.toBeNull();
    expect(screen.getByText('Helper message')).not.toBeNull();
    expect(screen.getByText('Error message')).not.toBeNull();
  });
});
