import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

vi.mock('@/components/ui/toaster', async () => {
  const actual = await vi.importActual('@/components/ui/toaster');
  return actual as any;
});

describe('Toaster', () => {
  it('renders a toast created via toaster.create()', async () => {
    const mod = await import('./toaster');
    const { Toaster, toaster } = mod;

    wrap(<Toaster />);

    toaster.create({
      title: 'Toast title',
      description: 'Toast description',
      type: 'success',
      duration: 1000,
    } as any);

    expect(await screen.findByText('Toast title')).not.toBeNull();
    expect(await screen.findByText('Toast description')).not.toBeNull();
  });
});
