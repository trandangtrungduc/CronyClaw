import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { CharacterConfigProvider, useConfig } from './character-config-context';
import Live2DConfigProvider, { useLive2DConfig, type ModelInfo } from './live2d-config-context';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

function wrap(ui: React.ReactNode) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <CharacterConfigProvider>
        <Live2DConfigProvider>{ui}</Live2DConfigProvider>
      </CharacterConfigProvider>
    </ChakraProvider>,
  );
}

function Consumer() {
  const { confUid } = useConfig();
  const { modelInfo, setModelInfo, isLoading } = useLive2DConfig();
  return (
    <div>
      <span data-testid="confUid">{confUid}</span>
      <span data-testid="isLoading">{String(isLoading)}</span>
      <span data-testid="kScale">{String(modelInfo?.kScale ?? '')}</span>
      <span data-testid="pointerInteractive">{String(modelInfo?.pointerInteractive ?? '')}</span>
      <span data-testid="scrollToResize">{String(modelInfo?.scrollToResize ?? '')}</span>
      <button
        type="button"
        onClick={() =>
          setModelInfo({
            url: 'u',
            kScale: 0.5,
            initialXshift: 0,
            initialYshift: 0,
            emotionMap: {},
          } as ModelInfo)
        }
      >
        set1
      </button>
      <button
        type="button"
        onClick={() =>
          setModelInfo({
            url: 'u2',
            kScale: 0.2,
            initialXshift: 0,
            initialYshift: 0,
            pointerInteractive: false,
            scrollToResize: false,
            emotionMap: {},
          } as ModelInfo)
        }
      >
        set2
      </button>
    </div>
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

describe('Live2DConfigContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('computes kScale and sets pointerInteractive/scrollToResize defaults', () => {
    wrap(<Consumer />);
    expect(screen.getByTestId('confUid').textContent).toBe('');
    expect(screen.getByTestId('isLoading').textContent).toBe('false');

    fireEvent.click(screen.getByText('set1'));
    expect(screen.getByTestId('kScale').textContent).toBe('1');
    expect(screen.getByTestId('pointerInteractive').textContent).toBe('true');
    expect(screen.getByTestId('scrollToResize').textContent).toBe('true');

    fireEvent.click(screen.getByText('set2'));
    expect(screen.getByTestId('kScale').textContent).toBe('0.4');
    expect(screen.getByTestId('pointerInteractive').textContent).toBe('false');
    expect(screen.getByTestId('scrollToResize').textContent).toBe('false');
  });

  it('throws when useLive2DConfig is used outside provider', () => {
    const Broken = () => {
      useLive2DConfig();
      return null;
    };
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('caught').textContent).toBe(
      'useLive2DConfig must be used within a Live2DConfigProvider',
    );
  });
});
