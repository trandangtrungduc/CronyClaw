import type { ReactNode } from 'react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AiStateProvider, useAiState, AiStateEnum } from './ai-state-context';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <div data-testid="caught">{this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

function renderWithProvider(ui: ReactNode) {
  return render(<AiStateProvider>{ui}</AiStateProvider>);
}

function AiStateConsumer() {
  const {
    aiState,
    setAiState,
    backendSynthComplete,
    setBackendSynthComplete,
    isWaiting,
    isIdle,
    resetState,
  } = useAiState();

  return (
    <div>
      <span data-testid="aiState">{aiState}</span>
      <span data-testid="isWaiting">{String(isWaiting)}</span>
      <span data-testid="isIdle">{String(isIdle)}</span>
      <span data-testid="backendSynthComplete">{String(backendSynthComplete)}</span>
      <button type="button" onClick={() => setAiState(AiStateEnum.WAITING)}>
        setWaiting
      </button>
      <button type="button" onClick={() => setBackendSynthComplete(true)}>
        setBackendSynthComplete
      </button>
      <button type="button" onClick={() => resetState()}>
        reset
      </button>
    </div>
  );
}

describe('AiStateContext', () => {
  it('provides initial state and transitions WAITING -> IDLE after 2s', () => {
    vi.useFakeTimers();

    renderWithProvider(<AiStateConsumer />);
    expect(screen.getByTestId('aiState').textContent).toBe(AiStateEnum.LOADING);

    fireEvent.click(screen.getByText('setWaiting'));
    expect(screen.getByTestId('aiState').textContent).toBe(AiStateEnum.WAITING);
    expect(screen.getByTestId('isWaiting').textContent).toBe('true');
    expect(screen.getByTestId('isIdle').textContent).toBe('false');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId('aiState').textContent).toBe(AiStateEnum.IDLE);
    expect(screen.getByTestId('isIdle').textContent).toBe('true');
    vi.useRealTimers();
  });

  it('exposes backendSynthComplete and resetState', () => {
    renderWithProvider(<AiStateConsumer />);
    expect(screen.getByTestId('backendSynthComplete').textContent).toBe('false');

    fireEvent.click(screen.getByText('setBackendSynthComplete'));
    expect(screen.getByTestId('backendSynthComplete').textContent).toBe('true');

    fireEvent.click(screen.getByText('reset'));
    expect(screen.getByTestId('aiState').textContent).toBe(AiStateEnum.IDLE);
  });

  it('throws when useAiState is used outside provider', () => {
    const Broken = () => {
      useAiState();
      return null;
    };
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('caught').textContent).toBe(
      'useAiState must be used within a AiStateProvider',
    );
  });
});
