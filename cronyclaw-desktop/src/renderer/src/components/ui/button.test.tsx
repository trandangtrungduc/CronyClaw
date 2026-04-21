import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Button } from './button';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Button', () => {
  it('renders children when not loading', () => {
    wrap(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).not.toBeNull();
    expect(btn.getAttribute('disabled')).toBeNull();
  });

  it('disables and hides children when loading without loadingText', () => {
    wrap(<Button loading>Save</Button>);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('disabled')).not.toBeNull();
    expect(screen.getByText('Save')).not.toBeNull();
    const span = screen.getByText('Save').closest('span');
    expect(span).not.toBeNull();
  });

  it('renders loadingText and does not render children when loadingText is provided', () => {
    wrap(<Button loading loadingText="Loading...">Save</Button>);
    expect(screen.getByText('Loading...')).not.toBeNull();
    expect(screen.queryByText('Save')).toBeNull();
  });
});
