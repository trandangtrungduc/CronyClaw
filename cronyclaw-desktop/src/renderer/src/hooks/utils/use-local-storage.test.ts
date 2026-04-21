import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './use-local-storage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads initial value and persists updates', () => {
    const { result } = renderHook(() => useLocalStorage('t-key', 'alpha'));
    expect(result.current[0]).toBe('alpha');
    act(() => {
      result.current[1]('beta');
    });
    expect(result.current[0]).toBe('beta');
    expect(localStorage.getItem('t-key')).toBe(JSON.stringify('beta'));
  });

  it('hydrates from existing localStorage value and supports updater functions', () => {
    localStorage.setItem('t-key', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('t-key', 'alpha'));
    expect(result.current[0]).toBe('stored');

    act(() => {
      result.current[1]((prev) => `${prev}-next`);
    });

    expect(result.current[0]).toBe('stored-next');
    expect(localStorage.getItem('t-key')).toBe(JSON.stringify('stored-next'));
  });

  it('applies filter to persisted value (state remains unfiltered)', () => {
    const filter = (v: string) => (v === 'beta' ? 'filtered' : v);
    const { result } = renderHook(() => useLocalStorage('t-key', 'alpha', { filter }));
    expect(result.current[0]).toBe('alpha');

    act(() => {
      result.current[1]('beta');
    });

    expect(result.current[0]).toBe('beta');
    expect(localStorage.getItem('t-key')).toBe(JSON.stringify('filtered'));
  });
});
