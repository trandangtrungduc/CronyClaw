import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import TitleBar from './title-bar';

function wrap(node: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{node}</ChakraProvider>);
}

describe('TitleBar', () => {
  const ipcSend = vi.fn();
  const ipcOn = vi.fn();
  const removeAllListeners = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (window as unknown as { electron: typeof window.electron }).electron = {
      ...window.electron,
      process: { platform: 'win32' },
      ipcRenderer: {
        ...window.electron?.ipcRenderer,
        send: ipcSend,
        on: ipcOn,
        removeAllListeners,
      },
    } as typeof window.electron;
  });

  afterEach(() => {
    (window as unknown as { electron?: typeof window.electron }).electron = {
      ...window.electron,
      ipcRenderer: {
        invoke: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        removeListener: vi.fn(),
        removeAllListeners: vi.fn(),
        send: vi.fn(),
      },
      desktopCapturer: { getSources: vi.fn().mockResolvedValue([]) },
      process: { platform: process.platform },
    } as typeof window.electron;
  });

  it('renders Mac layout without window controls when platform is darwin', () => {
    (window as unknown as { electron: typeof window.electron }).electron = {
      ...window.electron,
      process: { platform: 'darwin' },
      ipcRenderer: {
        send: ipcSend,
        on: ipcOn,
        removeAllListeners,
      },
    } as typeof window.electron;
    wrap(<TitleBar />);
    expect(screen.getAllByText('CronyClaw').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Minimize' })).toBeNull();
  });

  it('renders Windows controls and sends window-minimize', () => {
    wrap(<TitleBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Minimize' }));
    expect(ipcSend).toHaveBeenCalledWith('window-minimize');
  });

  it('sends window-close from close button', () => {
    wrap(<TitleBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(ipcSend).toHaveBeenCalledWith('window-close');
  });

  it('registers ipc listeners and removes them on unmount', () => {
    const { unmount } = wrap(<TitleBar />);
    expect(ipcOn).toHaveBeenCalledWith('window-maximized-change', expect.any(Function));
    expect(ipcOn).toHaveBeenCalledWith('window-fullscreen-change', expect.any(Function));
    unmount();
    expect(removeAllListeners).toHaveBeenCalledWith('window-maximized-change');
    expect(removeAllListeners).toHaveBeenCalledWith('window-fullscreen-change');
  });

  it('updates maximize label when ipc reports maximized', () => {
    wrap(<TitleBar />);
    const handler = ipcOn.mock.calls.find((c) => c[0] === 'window-maximized-change')![1] as (
      e: unknown,
      v: boolean,
    ) => void;
    act(() => handler({}, true));
    expect(screen.getByRole('button', { name: 'Restore' })).toBeTruthy();
    act(() => handler({}, false));
    expect(screen.getByRole('button', { name: 'Maximize' })).toBeTruthy();
  });

  it('sends window-maximize when not fullscreen and sends window-unfullscreen when fullscreen', () => {
    wrap(<TitleBar />);
    const fsHandler = ipcOn.mock.calls.find((c) => c[0] === 'window-fullscreen-change')![1] as (
      e: unknown,
      v: boolean,
    ) => void;
    act(() => fsHandler({}, true));
    fireEvent.click(screen.getByRole('button', { name: 'Exit Full Screen' }));
    expect(ipcSend).toHaveBeenCalledWith('window-unfullscreen');
    ipcSend.mockClear();
    act(() => fsHandler({}, false));
    fireEvent.click(screen.getByRole('button', { name: 'Maximize' }));
    expect(ipcSend).toHaveBeenCalledWith('window-maximize');
  });
});
