import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useDraggable } from './use-draggable';

let modeValue: 'window' | 'pet' = 'window';

vi.mock('@/context/mode-context', () => ({
  useMode: () => ({
    mode: modeValue,
    setMode: vi.fn(),
    isElectron: false,
  }),
}));

function Harness({ componentId }: { componentId: string }) {
  const {
    elementRef,
    isDragging,
    handleMouseDown,
    handleMouseEnter,
    handleMouseLeave,
  } = useDraggable({ componentId });

  return React.createElement(
    'div',
    null,
    React.createElement('div', { ref: elementRef, 'data-testid': 'draggable' }),
    React.createElement('span', { 'data-testid': 'isDragging' }, String(isDragging)),
    React.createElement(
      'button',
      { type: 'button', onClick: handleMouseEnter },
      'enter',
    ),
    React.createElement(
      'button',
      { type: 'button', onClick: handleMouseLeave },
      'leave',
    ),
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: () => handleMouseDown({ clientX: 10, clientY: 20 } as any),
      },
      'down',
    ),
  );
}

describe('useDraggable', () => {
  beforeEach(() => {
    modeValue = 'window';
    (window as any).api.updateComponentHover.mockClear();
  });

  it('sends hover on enter/leave only in pet mode', () => {
    modeValue = 'pet';

    render(React.createElement(Harness, { componentId: 'c1' }));

    fireEvent.click(screen.getByText('enter'));
    expect(window.api.updateComponentHover).toHaveBeenCalledWith('c1', true);

    fireEvent.click(screen.getByText('leave'));
    expect(window.api.updateComponentHover).toHaveBeenCalledWith('c1', false);
  });

  it('does not send hover notifications in window mode', () => {
    modeValue = 'window';

    render(React.createElement(Harness, { componentId: 'c1' }));

    fireEvent.click(screen.getByText('enter'));
    fireEvent.click(screen.getByText('leave'));
    expect(window.api.updateComponentHover).not.toHaveBeenCalled();
  });

  it('updates element transform during drag and resets isDragging on mouseup', async () => {
    modeValue = 'pet';

    render(React.createElement(Harness, { componentId: 'c1' }));

    const el = screen.getByTestId('draggable');
    expect(el.getAttribute('style')).toBeNull();
    expect(screen.getByTestId('isDragging').textContent).toBe('false');

    await act(async () => {
      fireEvent.click(screen.getByText('down'));
    });
    expect(screen.getByTestId('isDragging').textContent).toBe('true');

    act(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 15, clientY: 25 }));
    });
    expect((el as HTMLElement).style.transform).toContain('translate(5px, 5px)');

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup', {}));
    });
    expect(screen.getByTestId('isDragging').textContent).toBe('false');

    const transformAfterUp = (el as HTMLElement).style.transform;
    act(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 30, clientY: 40 }));
    });
    expect((el as HTMLElement).style.transform).toBe(transformAfterUp);
  });
});
