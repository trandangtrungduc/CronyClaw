import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ColorModeProvider, ColorModeButton } from './color-mode';

const useThemeMock = vi.fn();

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

describe('color-mode', () => {
  it('shows sun icon in light mode and toggles to dark on click', () => {
    const setTheme = vi.fn();
    useThemeMock.mockReturnValue({
      resolvedTheme: 'light',
      setTheme,
    } as any);

    render(
      <ChakraProvider value={defaultSystem}>
        <ColorModeProvider>
          <ColorModeButton />
        </ColorModeProvider>
      </ChakraProvider>,
    );

    expect(screen.queryByTestId('sun-icon')).not.toBeNull();
    expect(screen.queryByTestId('moon-icon')).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: 'Toggle color mode' }),
    );
    expect(setTheme).toHaveBeenCalledTimes(1);
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('shows moon icon in dark mode and toggles to light on click', () => {
    const setTheme = vi.fn();
    useThemeMock.mockReturnValue({
      resolvedTheme: 'dark',
      setTheme,
    } as any);

    render(
      <ChakraProvider value={defaultSystem}>
        <ColorModeProvider>
          <ColorModeButton />
        </ColorModeProvider>
      </ChakraProvider>,
    );

    expect(screen.queryByTestId('moon-icon')).not.toBeNull();
    expect(screen.queryByTestId('sun-icon')).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: 'Toggle color mode' }),
    );
    expect(setTheme).toHaveBeenCalledTimes(1);
    expect(setTheme).toHaveBeenCalledWith('light');
  });
});
