import { describe, it, expect, vi, beforeEach } from 'vitest';

const workArea = { x: 0, y: 0, width: 1920, height: 1080 };

const { getLastWindow, MockBrowserWindow } = vi.hoisted(() => {
  let last: ReturnType<typeof makeMockWindowImpl>;
  function makeMockWindowImpl() {
    return {
      on: vi.fn(),
      once: vi.fn(),
      webContents: {
        send: vi.fn(),
        isDevToolsOpened: vi.fn(() => false),
        closeDevTools: vi.fn(),
        openDevTools: vi.fn(),
        setWindowOpenHandler: vi.fn(),
      },
      setOpacity: vi.fn(),
      show: vi.fn(),
      hide: vi.fn(),
      minimize: vi.fn(),
      maximize: vi.fn(),
      unmaximize: vi.fn(),
      isMaximized: vi.fn(() => false),
      isFullScreen: vi.fn(() => false),
      setFullScreen: vi.fn(),
      close: vi.fn(),
      getBounds: vi.fn(() => ({ x: 0, y: 0, width: 900, height: 670 })),
      setBounds: vi.fn(),
      setIgnoreMouseEvents: vi.fn(),
      setVisibleOnAllWorkspaces: vi.fn(),
      setAlwaysOnTop: vi.fn(),
      isVisible: vi.fn(() => true),
      setPosition: vi.fn(),
      setSize: vi.fn(),
      center: vi.fn(),
      setResizable: vi.fn(),
      setSkipTaskbar: vi.fn(),
      setFocusable: vi.fn(),
      setBackgroundColor: vi.fn(),
      setWindowButtonVisibility: vi.fn(),
      loadURL: vi.fn(),
      loadFile: vi.fn(),
    };
  }
  const MockBrowserWindow = vi.fn(function MockBW() {
    last = makeMockWindowImpl();
    return last;
  });
  return {
    getLastWindow: () => last!,
    MockBrowserWindow,
  };
});

vi.mock('electron', () => ({
  BrowserWindow: MockBrowserWindow,
  screen: {
    getPrimaryDisplay: () => ({
      workArea,
      workAreaSize: { width: workArea.width, height: workArea.height },
    }),
    getAllDisplays: () => [{ bounds: { x: 0, y: 0, width: 1920, height: 1080 } }],
  },
  shell: { openExternal: vi.fn() },
  ipcMain: {
    on: vi.fn(),
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
}));

vi.mock('@electron-toolkit/utils', () => ({
  is: { dev: false },
  optimizer: { watchWindowShortcuts: vi.fn() },
}));

import { WindowManager } from './window-manager';

describe('WindowManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockBrowserWindow.mockClear();
  });

  it('starts in window mode with no window until createWindow', () => {
    const wm = new WindowManager();
    expect(wm.getCurrentMode()).toBe('window');
    expect(wm.getWindow()).toBeNull();
    expect(wm.isForceIgnoreMouse()).toBe(false);
  });

  it('createWindow instantiates BrowserWindow and returns it', () => {
    const wm = new WindowManager();
    const win = wm.createWindow({ width: 100 });
    expect(MockBrowserWindow).toHaveBeenCalled();
    const mock = getLastWindow();
    expect(win).toBe(mock);
    expect(wm.getWindow()).toBe(win);
    expect(mock.loadFile).toHaveBeenCalled();
    expect(mock.webContents.setWindowOpenHandler).toHaveBeenCalled();
  });

  it('setWindowMode sets mode and sends pre-mode events', () => {
    const wm = new WindowManager();
    wm.createWindow({});
    const mock = getLastWindow();
    wm.setWindowMode('pet');
    expect(wm.getCurrentMode()).toBe('pet');
    expect(mock.setOpacity).toHaveBeenCalledWith(0);
    expect(mock.webContents.send).toHaveBeenCalledWith('pre-mode-changed', 'pet');
  });

  it('setIgnoreMouseEvents forwards to window on non-mac path', () => {
    const wm = new WindowManager();
    wm.createWindow({});
    const mock = getLastWindow();
    wm.setIgnoreMouseEvents(true);
    expect(mock.setIgnoreMouseEvents).toHaveBeenCalledWith(true, { forward: true });
  });

  it('maximizeWindow expands to work area when smaller than work area', () => {
    const wm = new WindowManager();
    wm.createWindow({});
    const mock = getLastWindow();
    mock.getBounds.mockReturnValue({ x: 10, y: 10, width: 400, height: 300 });
    wm.maximizeWindow();
    expect(mock.setBounds).toHaveBeenCalledWith({
      x: 0,
      y: 0,
      width: workArea.width,
      height: workArea.height,
    });
    expect(mock.webContents.send).toHaveBeenCalledWith('window-maximized-change', true);
  });

  it('updateComponentHover is no-op in window mode', () => {
    const wm = new WindowManager();
    wm.createWindow({});
    const mock = getLastWindow();
    wm.updateComponentHover('a', true);
    expect(mock.setIgnoreMouseEvents).not.toHaveBeenCalled();
  });

  it('updateComponentHover calls setIgnoreMouseEvents in pet mode', () => {
    const wm = new WindowManager();
    wm.createWindow({});
    wm.setWindowMode('pet');
    const mock = getLastWindow();
    mock.setIgnoreMouseEvents.mockClear();
    wm.updateComponentHover('dock', true);
    expect(mock.setIgnoreMouseEvents).toHaveBeenCalled();
  });

  it('toggleForceIgnoreMouse flips state and notifies renderer', () => {
    const wm = new WindowManager();
    wm.createWindow({});
    const mock = getLastWindow();
    wm.toggleForceIgnoreMouse();
    expect(wm.isForceIgnoreMouse()).toBe(true);
    expect(mock.webContents.send).toHaveBeenCalledWith('force-ignore-mouse-changed', true);
  });

  it('isWindowMaximized compares bounds to work area', () => {
    const wm = new WindowManager();
    wm.createWindow({});
    const mock = getLastWindow();
    mock.getBounds.mockReturnValue({
      x: 0,
      y: 0,
      width: workArea.width,
      height: workArea.height,
    });
    expect(wm.isWindowMaximized()).toBe(true);
  });
});
