import { describe, it, expect } from 'vitest';
import React, { type ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { SubtitleProvider, useSubtitle } from '@/context/subtitle-context';
import { useSubtitleDisplay } from './use-subtitle-display';

const DEFAULT_TEXT = "Hi, I'm CronyClaw. Who the hell are ya? Ahh, you must be amazed by my awesomeness, right? right?";

function Consumer() {
  const { setSubtitleText, setShowSubtitle } = useSubtitle();
  const { subtitleText, isLoaded } = useSubtitleDisplay();

  return React.createElement(
    'div',
    null,
    React.createElement(
      'span',
      { 'data-testid': 'subtitleText' },
      subtitleText ?? 'null',
    ),
    React.createElement('span', { 'data-testid': 'isLoaded' }, String(isLoaded)),
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: () => setSubtitleText('hello subtitle'),
      },
      'setSubtitle',
    ),
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: () => setShowSubtitle(false),
      },
      'hide',
    ),
  );
}

function wrap(ui: ReactNode) {
  return render(
    React.createElement(
      ChakraProvider,
      { value: defaultSystem },
      React.createElement(SubtitleProvider, null, ui),
    ),
  );
}

describe('useSubtitleDisplay', () => {
  it('returns subtitleText from context and isLoaded=true', () => {
    wrap(React.createElement(Consumer));

    expect(screen.getByTestId('subtitleText').textContent).toBe(DEFAULT_TEXT);
    expect(screen.getByTestId('isLoaded').textContent).toBe('true');

    fireEvent.click(screen.getByText('setSubtitle'));
    expect(screen.getByTestId('subtitleText').textContent).toBe('hello subtitle');

    fireEvent.click(screen.getByText('hide'));
    expect(screen.getByTestId('subtitleText').textContent).toBe('hello subtitle');
    expect(screen.getByTestId('isLoaded').textContent).toBe('true');
  });
});
