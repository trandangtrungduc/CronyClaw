import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserProvider, useBrowser, type BrowserViewData } from './browser-context';

function wrap(ui: ReactNode) {
  return render(<BrowserProvider>{ui}</BrowserProvider>);
}

function BrowserConsumer() {
  const { browserViewData, setBrowserViewData, clearBrowserViewData } = useBrowser();
  return (
    <div>
      <span data-testid="browserUrl">{browserViewData?.debuggerFullscreenUrl ?? 'null'}</span>
      <button
        type="button"
        onClick={() =>
          setBrowserViewData({
            debuggerFullscreenUrl: 'https://example.com/full',
            debuggerUrl: 'https://example.com',
            wsUrl: 'wss://example.com',
            pages: [
              {
                id: 'p1',
                url: 'https://example.com/p1',
                faviconUrl: 'https://example.com/favicon.png',
                title: 'Page 1',
                debuggerUrl: 'https://example.com/p1',
                debuggerFullscreenUrl: 'https://example.com/p1/full',
              },
            ],
          } as BrowserViewData)
        }
      >
        set
      </button>
      <button type="button" onClick={() => clearBrowserViewData()}>
        clear
      </button>
    </div>
  );
}

describe('BrowserContext', () => {
  it('defaults to browserViewData=null inside provider and supports set/clear', () => {
    wrap(<BrowserConsumer />);
    expect(screen.getByTestId('browserUrl').textContent).toBe('null');
    fireEvent.click(screen.getByText('set'));
    expect(screen.getByTestId('browserUrl').textContent).toBe('https://example.com/full');
    fireEvent.click(screen.getByText('clear'));
    expect(screen.getByTestId('browserUrl').textContent).toBe('null');
  });

  it('hook provides default values even when provider is missing', () => {
    const NoProviderConsumer = () => {
      const { browserViewData } = useBrowser();
      return <span data-testid="browserUrl">{browserViewData ? 'hasData' : 'null'}</span>;
    };
    render(<NoProviderConsumer />);
    expect(screen.getByTestId('browserUrl').textContent).toBe('null');
  });
});
