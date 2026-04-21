import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverCloseTrigger,
} from './popover';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Popover', () => {
  it('renders content and closes when clicking Close button', async () => {
    const { container } = wrap(
      <PopoverRoot defaultOpen>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent portalled={false}>
          <div>Popover body</div>
          <PopoverCloseTrigger />
        </PopoverContent>
      </PopoverRoot>,
    );

    expect(screen.getByText('Popover body')).not.toBeNull();
    fireEvent.click(screen.getByLabelText('close'));
    await waitFor(() => {
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog!.getAttribute('data-state')).toBe('closed');
      expect(dialog!.getAttribute('hidden')).not.toBeNull();
    });
  });
});
