import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import {
  DrawerRoot,
  DrawerContent,
  DrawerCloseTrigger,
} from './drawer';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Drawer', () => {
  it('renders provided content and closes on CloseButton click', () => {
    wrap(
      <DrawerRoot defaultOpen placement="start">
        <DrawerContent portalled={false}>
          <div>Drawer body</div>
          <DrawerCloseTrigger />
        </DrawerContent>
      </DrawerRoot>,
    );

    expect(screen.getByText('Drawer body')).not.toBeNull();
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeBtn);
    void waitFor(() => {
      expect(screen.queryByText('Drawer body')).toBeNull();
    });
  });
});
