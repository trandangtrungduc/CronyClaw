import React, { type ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { SubtitleProvider, useSubtitle } from './subtitle-context';

const DEFAULT_TEXT = "Hi, I'm CronyClaw. Who the hell are ya? Ahh, you must be amazed by my awesomeness, right? right?";

function Consumer() {
  const {
    subtitleText,
    setSubtitleText,
    showSubtitle,
    setShowSubtitle,
  } = useSubtitle();

  return (
    <div>
      <span data-testid="subtitleText">{subtitleText}</span>
      <span data-testid="showSubtitle">{String(showSubtitle)}</span>
      <button type="button" onClick={() => setSubtitleText('new text')}>
        setText
      </button>
      <button type="button" onClick={() => setShowSubtitle(false)}>
        hide
      </button>
      <button type="button" onClick={() => setShowSubtitle(true)}>
        show
      </button>
    </div>
  );
}

function wrap(ui: ReactNode) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <SubtitleProvider>{ui}</SubtitleProvider>
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

describe('SubtitleContext', () => {
  it('exposes default subtitle and supports setting text + visibility', () => {
    wrap(<Consumer />);

    expect(screen.getByTestId('subtitleText').textContent).toBe(DEFAULT_TEXT);
    expect(screen.getByTestId('showSubtitle').textContent).toBe('true');

    fireEvent.click(screen.getByText('setText'));
    expect(screen.getByTestId('subtitleText').textContent).toBe('new text');

    fireEvent.click(screen.getByText('hide'));
    expect(screen.getByTestId('showSubtitle').textContent).toBe('false');

    fireEvent.click(screen.getByText('show'));
    expect(screen.getByTestId('showSubtitle').textContent).toBe('true');
  });

  it('throws when useSubtitle is used outside provider', () => {
    const Broken = () => {
      useSubtitle();
      return null;
    };

    render(
      <ErrorBoundary>
        <ChakraProvider value={defaultSystem}>
          <Broken />
        </ChakraProvider>
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('caught').textContent).toBe(
      'useSubtitle must be used within a SubtitleProvider',
    );
  });
});
