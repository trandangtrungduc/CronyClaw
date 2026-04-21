import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBackground } from './use-background';

let backgroundUrl: string | null = 'http://127.0.0.1/bg.jpg';

vi.mock('@/context/bgurl-context', () => ({
  useBgUrl: () => {
    if (!backgroundUrl) return undefined;
    return {
      backgroundUrl,
      setBackgroundUrl: vi.fn(),
      backgroundFiles: [],
      setBackgroundFiles: vi.fn(),
      resetBackground: vi.fn(),
      addBackgroundFile: vi.fn(),
      removeBackgroundFile: vi.fn(),
      isDefaultBackground: true,
      useCameraBackground: false,
      setUseCameraBackground: vi.fn(),
    };
  },
}));

describe('useBackground', () => {
  it('derives state from BgUrl context', () => {
    const { result } = renderHook(() => useBackground());
    expect(result.current.backgroundUrl).toBe('http://127.0.0.1/bg.jpg');
    expect(result.current.isLoaded).toBe(true);
  });

  it('updates when backgroundUrl changes and reflects unloaded state', () => {
    const { result, rerender } = renderHook(() => useBackground());
    expect(result.current.backgroundUrl).toBe('http://127.0.0.1/bg.jpg');
    expect(result.current.isLoaded).toBe(true);

    backgroundUrl = 'http://127.0.0.1/other.jpg';
    rerender();
    expect(result.current.backgroundUrl).toBe('http://127.0.0.1/other.jpg');
    expect(result.current.isLoaded).toBe(true);

    backgroundUrl = null;
    rerender();
    expect(result.current.backgroundUrl).toBeNull();
    expect(result.current.isLoaded).toBe(false);
  });
});
