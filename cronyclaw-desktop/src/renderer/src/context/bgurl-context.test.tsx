import type { ReactNode } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WebSocketProvider } from './websocket-context';
import { BgUrlProvider, useBgUrl } from './bgurl-context';

function wrap(ui: ReactNode) {
  return render(
    <WebSocketProvider>
      <BgUrlProvider>{ui}</BgUrlProvider>
    </WebSocketProvider>,
  );
}

function BgUrlConsumer() {
  const {
    backgroundUrl,
    setBackgroundUrl,
    backgroundFiles,
    addBackgroundFile,
    removeBackgroundFile,
    resetBackground,
    isDefaultBackground,
    useCameraBackground,
    setUseCameraBackground,
  } = useBgUrl();

  return (
    <div>
      <span data-testid="backgroundUrl">{backgroundUrl}</span>
      <span data-testid="isDefaultBackground">{String(isDefaultBackground)}</span>
      <span data-testid="useCameraBackground">{String(useCameraBackground)}</span>
      <span data-testid="files">{backgroundFiles.map((f) => f.name).join(',')}</span>
      <button type="button" onClick={() => setBackgroundUrl('http://new/bg.jpg')}>
        setBg
      </button>
      <button
        type="button"
        onClick={() => addBackgroundFile({ name: 'a', url: 'http://img/a.jpg' })}
      >
        addFile
      </button>
      <button type="button" onClick={() => removeBackgroundFile('a')}>
        removeFile
      </button>
      <button type="button" onClick={() => resetBackground()}>
        resetBg
      </button>
      <button type="button" onClick={() => setUseCameraBackground(true)}>
        enableCameraBg
      </button>
    </div>
  );
}

describe('BgUrlContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem('baseUrl', JSON.stringify('http://base.test'));
    window.localStorage.setItem('wsUrl', JSON.stringify('ws://base.test'));
  });

  it('uses baseUrl to compute default backgroundUrl and updates when setters are called', () => {
    wrap(<BgUrlConsumer />);

    expect(screen.getByTestId('backgroundUrl').textContent).toBe('http://base.test/bg/magic-city.jpeg');
    expect(screen.getByTestId('isDefaultBackground').textContent).toBe('true');
    expect(screen.getByTestId('useCameraBackground').textContent).toBe('false');
    expect(screen.getByTestId('files').textContent).toBe('');

    fireEvent.click(screen.getByText('setBg'));
    expect(screen.getByTestId('backgroundUrl').textContent).toBe('http://new/bg.jpg');
    expect(screen.getByTestId('isDefaultBackground').textContent).toBe('false');

    fireEvent.click(screen.getByText('addFile'));
    expect(screen.getByTestId('files').textContent).toBe('a');

    fireEvent.click(screen.getByText('removeFile'));
    expect(screen.getByTestId('files').textContent).toBe('');

    fireEvent.click(screen.getByText('enableCameraBg'));
    expect(screen.getByTestId('useCameraBackground').textContent).toBe('true');

    fireEvent.click(screen.getByText('resetBg'));
    expect(screen.getByTestId('backgroundUrl').textContent).toBe('http://base.test/bg/magic-city.jpeg');
    expect(screen.getByTestId('isDefaultBackground').textContent).toBe('true');
  });
});
