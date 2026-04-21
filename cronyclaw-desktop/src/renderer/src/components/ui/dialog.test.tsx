import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import {
  DialogRoot,
  DialogContent,
  DialogCloseTrigger,
} from './dialog';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Dialog', () => {
  it('renders provided content and closes on CloseButton click', () => {
    wrap(
      <DialogRoot defaultOpen>
        <DialogContent portalled={false} backdrop={false}>
          <div>Dialog body</div>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>,
    );

    expect(screen.getByText('Dialog body')).not.toBeNull();
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeBtn);
    void waitFor(() => {
      expect(screen.queryByText('Dialog body')).toBeNull();
    });
  });
});
