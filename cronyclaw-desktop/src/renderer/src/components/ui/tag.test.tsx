import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Tag } from './tag';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Tag', () => {
  it('renders label plus optional start/end elements', () => {
    wrap(
      <Tag startElement={<span>START</span>} endElement={<span>END</span>}>
        Hello
      </Tag>,
    );
    expect(screen.getByText('Hello')).not.toBeNull();
    expect(screen.getByText('START')).not.toBeNull();
    expect(screen.getByText('END')).not.toBeNull();
  });

  it('calls onClose when closable tag close button is clicked', () => {
    const onClose = vi.fn();
    wrap(
      <Tag onClose={onClose} startElement="S">
        Close me
      </Tag>,
    );
    const closeBtn = screen.getAllByRole('button')[0];
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
