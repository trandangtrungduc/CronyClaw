import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { AiStateProvider, useAiState, AiStateEnum } from './ai-state-context';
import { ProactiveSpeakProvider, useProactiveSpeak } from './proactive-speak-context';
import type { ReactNode } from 'react';

const sendTriggerSignalMock = vi.fn();

vi.mock('@/hooks/utils/use-trigger-speak', () => ({
  useTriggerSpeak: () => ({
    sendTriggerSignal: sendTriggerSignalMock,
  }),
}));

function Harness() {
  const { settings, updateSettings } = useProactiveSpeak();
  const { setAiState } = useAiState();

  return (
    <div>
      <span data-testid="allowProactiveSpeak">{String(settings.allowProactiveSpeak)}</span>
      <span data-testid="idleSecondsToSpeak">{String(settings.idleSecondsToSpeak)}</span>
      <button
        type="button"
        onClick={() =>
          updateSettings({
            allowProactiveSpeak: true,
            allowButtonTrigger: false,
            idleSecondsToSpeak: 1,
          })}
      >
        enable
      </button>
      <button
        type="button"
        onClick={() =>
          updateSettings({
            allowProactiveSpeak: false,
            allowButtonTrigger: false,
            idleSecondsToSpeak: 1,
          })}
      >
        disable
      </button>
      <button type="button" onClick={() => setAiState(AiStateEnum.IDLE)}>
        goIdle
      </button>
    </div>
  );
}

function wrap(ui: ReactNode) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <AiStateProvider>
        <ProactiveSpeakProvider>{ui}</ProactiveSpeakProvider>
      </AiStateProvider>
    </ChakraProvider>,
  );
}

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

describe('ProactiveSpeakContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('triggers sendTriggerSignal after idle when allowProactiveSpeak is enabled', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(0));

    wrap(<Harness />);

    expect(screen.getByTestId('allowProactiveSpeak').textContent).toBe('false');
    expect(screen.getByTestId('idleSecondsToSpeak').textContent).toBe('5');

    act(() => {
      fireEvent.click(screen.getByText('enable'));
      fireEvent.click(screen.getByText('goIdle'));
    });

    expect(sendTriggerSignalMock).toHaveBeenCalledTimes(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(sendTriggerSignalMock).toHaveBeenCalledTimes(1);
    expect(sendTriggerSignalMock.mock.calls[0][0]).toBeCloseTo(1, 2);
  });

  it('does not trigger sendTriggerSignal when allowProactiveSpeak is disabled', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(0));

    wrap(<Harness />);

    act(() => {
      fireEvent.click(screen.getByText('disable'));
      fireEvent.click(screen.getByText('goIdle'));
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(sendTriggerSignalMock).toHaveBeenCalledTimes(0);
  });

  it('throws when useProactiveSpeak is used outside provider', () => {
    const Broken = () => {
      useProactiveSpeak();
      return null;
    };
    render(
      <ErrorBoundary>
        <ChakraProvider value={defaultSystem}>
          <AiStateProvider>
            <Broken />
          </AiStateProvider>
        </ChakraProvider>
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('caught').textContent).toBe(
      'useProactiveSpeak must be used within a ProactiveSpeakProvider',
    );
  });
});
