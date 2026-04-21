import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ClipboardRoot, ClipboardButton } from './clipboard';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Clipboard', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('copies ClipboardRoot value when ClipboardButton is clicked', async () => {
    const writeTextMock = (navigator.clipboard as any).writeText as unknown as ReturnType<typeof vi.fn>;
    wrap(
      <ClipboardRoot value="hello">
        <ClipboardButton>copy</ClipboardButton>
      </ClipboardRoot>,
    );

    const btn = screen.getByRole('button');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledTimes(1);
      expect(writeTextMock).toHaveBeenCalledWith('hello');
    });
  });
});
