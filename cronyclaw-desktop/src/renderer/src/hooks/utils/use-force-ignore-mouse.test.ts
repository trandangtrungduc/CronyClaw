import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react';
import { useForceIgnoreMouse } from './use-force-ignore-mouse';

describe('useForceIgnoreMouse', () => {
  it('starts with forceIgnoreMouse=false and allows toggling', () => {
    const { result } = renderHook(() => useForceIgnoreMouse());
    expect(result.current.forceIgnoreMouse).toBe(false);

    act(() => {
      result.current.setForceIgnoreMouse(true);
    });
    expect(result.current.forceIgnoreMouse).toBe(true);

    act(() => {
      result.current.setForceIgnoreMouse(false);
    });
    expect(result.current.forceIgnoreMouse).toBe(false);
  });
});
