import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Provider } from './provider';
import { ColorModeButton } from './color-mode';

const useThemeMock = vi.fn();
const setThemeMock = vi.fn();

vi.mock('next-themes', () => {
  return {
    ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    useTheme: () => useThemeMock(),
  };
});

vi.mock('react-icons/lu', () => {
  return {
    LuSun: () => <span data-testid="sun-icon">sun</span>,
    LuMoon: () => <span data-testid="moon-icon">moon</span>,
  };
});

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Provider', () => {
  it('passes ColorModeProvider context so ColorModeButton toggles theme', () => {
    setThemeMock.mockClear();
    useThemeMock.mockReturnValue({
      resolvedTheme: 'light',
      setTheme: setThemeMock,
    });

    wrap(
      <Provider>
        <ColorModeButton />
      </Provider>,
    );

    expect(screen.queryByTestId('sun-icon')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle color mode' }));
    expect(setThemeMock).toHaveBeenCalledTimes(1);
    expect(setThemeMock).toHaveBeenCalledWith('dark');
  });
});
