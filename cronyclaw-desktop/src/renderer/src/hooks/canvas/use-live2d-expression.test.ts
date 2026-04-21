import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLive2DExpression } from './use-live2d-expression';

describe('useLive2DExpression', () => {
  it('setExpression sets by string value', () => {
    const adapter = {
      setExpression: vi.fn(),
      getExpressionName: vi.fn(),
      getExpressionCount: vi.fn(),
      getModel: vi.fn(),
    };

    const { result } = renderHook(() => useLive2DExpression());
    act(() => {
      result.current.setExpression('smile', adapter, 'ok');
    });

    expect(adapter.setExpression).toHaveBeenCalledWith('smile');
  });

  it('setExpression sets by numeric index using getExpressionName', () => {
    const adapter = {
      setExpression: vi.fn(),
      getExpressionName: vi.fn().mockReturnValue('happy'),
      getExpressionCount: vi.fn(),
      getModel: vi.fn(),
    };

    const { result } = renderHook(() => useLive2DExpression());
    act(() => {
      result.current.setExpression(2, adapter);
    });

    expect(adapter.getExpressionName).toHaveBeenCalledWith(2);
    expect(adapter.setExpression).toHaveBeenCalledWith('happy');
  });

  it('setExpression does not set expression if getExpressionName returns falsy', () => {
    const adapter = {
      setExpression: vi.fn(),
      getExpressionName: vi.fn().mockReturnValue(''),
      getExpressionCount: vi.fn(),
      getModel: vi.fn(),
    };

    const { result } = renderHook(() => useLive2DExpression());
    act(() => {
      result.current.setExpression(2, adapter);
    });

    expect(adapter.setExpression).not.toHaveBeenCalled();
  });

  it('resetExpression uses defaultEmotion when provided', () => {
    const adapter = {
      setExpression: vi.fn(),
      getExpressionName: vi.fn(),
      getExpressionCount: vi.fn(),
      getModel: vi.fn().mockReturnValue({ _modelSetting: {} }),
    };

    const { result } = renderHook(() => useLive2DExpression());
    act(() => {
      result.current.resetExpression(adapter, { defaultEmotion: 'sad' } as any);
    });

    expect(adapter.setExpression).toHaveBeenCalledWith('sad');
  });

  it('resetExpression falls back to first expression name when no defaultEmotion', () => {
    const adapter = {
      setExpression: vi.fn(),
      getExpressionName: vi.fn().mockReturnValue('neutral'),
      getExpressionCount: vi.fn().mockReturnValue(3),
      getModel: vi.fn().mockReturnValue({ _modelSetting: {} }),
    };

    const { result } = renderHook(() => useLive2DExpression());
    act(() => {
      result.current.resetExpression(adapter, undefined);
    });

    expect(adapter.getExpressionCount).toHaveBeenCalled();
    expect(adapter.getExpressionName).toHaveBeenCalledWith(0);
    expect(adapter.setExpression).toHaveBeenCalledWith('neutral');
  });

  it('resetExpression skips when model settings are not ready', () => {
    const adapter = {
      setExpression: vi.fn(),
      getExpressionName: vi.fn(),
      getExpressionCount: vi.fn(),
      getModel: vi.fn().mockReturnValue(null),
    };

    const { result } = renderHook(() => useLive2DExpression());
    act(() => {
      result.current.resetExpression(adapter, { defaultEmotion: 'sad' } as any);
    });

    expect(adapter.setExpression).not.toHaveBeenCalled();
  });
});
