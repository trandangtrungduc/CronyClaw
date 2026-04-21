import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ModeProvider, useMode } from './mode-context';
import { toaster } from '../components/ui/toaster';

function Consumer({ exposeSetMode }: { exposeSetMode?: boolean }) {
  const { mode, setMode, isElectron } = useMode();

  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="isElectron">{String(isElectron)}</span>
      {exposeSetMode ? (
        <>
          <button type="button" onClick={() => setMode('window')}>
            setWindow
          </button>
          <button type="button" onClick={() => setMode('pet')}>
            setPet
          </button>
        </>
      ) : null}
    </div>
  );
}

describe('ModeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).__originalApi = (window as any).api;
  });

  afterEach(() => {
    Object.defineProperty(window, 'api', {
      configurable: true,
      writable: true,
      value: (window as any).__originalApi,
    });
  });

  it('uses electron api when available', () => {
    const api = window.api as any;
    const setModeSpy = vi.spyOn(api, 'setMode');

    render(
      <ChakraProvider value={defaultSystem}>
        <ModeProvider>
          <Consumer exposeSetMode />
        </ModeProvider>
      </ChakraProvider>,
    );

    expect(screen.getByTestId('mode').textContent).toBe('window');
    expect(screen.getByTestId('isElectron').textContent).toBe('true');

    fireEvent.click(screen.getByText('setPet'));
    expect(setModeSpy).toHaveBeenCalledWith('pet');
    expect(screen.getByTestId('mode').textContent).toBe('window');
  });

  it('blocks pet mode and shows toast when api is missing', () => {
    Object.defineProperty(window, 'api', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    render(
      <ChakraProvider value={defaultSystem}>
        <ModeProvider>
          <Consumer exposeSetMode />
        </ModeProvider>
      </ChakraProvider>,
    );

    expect(screen.getByTestId('mode').textContent).toBe('window');
    expect(screen.getByTestId('isElectron').textContent).toBe('false');

    fireEvent.click(screen.getByText('setPet'));

    expect(toaster.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Pet mode unavailable',
      }),
    );
    expect(screen.getByTestId('mode').textContent).toBe('window');
  });
});
