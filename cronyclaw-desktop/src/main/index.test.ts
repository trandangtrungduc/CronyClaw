import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
  mockWindow,
  mockWm,
  mockMm,
  MockWindowManager,
  MockMenuManager,
  ipcHandlers,
  ipcOnListeners,
  appListeners,
  appMocks,
  toolkitMocks,
} = vi.hoisted(() => {
  const ipcHandlers = new Map<string, (...args: unknown[]) => unknown>();
  const ipcOnListeners = new Map<string, ((...args: unknown[]) => void)[]>();
  const appListeners = new Map<string, ((...args: unknown[]) => void)[]>();

  const mockWindow = {
      on: vi.fn(),
      minimize: vi.fn(),
      hide: vi.fn(),
      close: vi.fn(),
      webContents: {},
    };

  const mockWm = {
    createWindow: vi.fn(() => mockWindow),
    getWindow: vi.fn(() => mockWindow),
    getCurrentMode: vi.fn(() => 'window' as const),
    setWindowMode: vi.fn(),
    setIgnoreMouseEvents: vi.fn(),
    maximizeWindow: vi.fn(),
    updateComponentHover: vi.fn(),
  };

  const mockMm = {
    createTray: vi.fn(),
    getConfigFiles: vi.fn(() => [] as { filename: string; name: string }[]),
    updateConfigFiles: vi.fn(),
    setMode: vi.fn(),
    destroy: vi.fn(),
  };

  const MockWindowManager = vi.fn(function WindowManager() {
    return mockWm;
  });
  const MockMenuManager = vi.fn(function MenuManager() {
    return mockMm;
  });

  const appMocks = {
    whenReady: vi.fn(() => Promise.resolve()),
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      const list = appListeners.get(event) ?? [];
      list.push(cb);
      appListeners.set(event, list);
    }),
    quit: vi.fn(),
  };

  const toolkitMocks = {
    electronApp: { setAppUserModelId: vi.fn() },
    optimizer: { watchWindowShortcuts: vi.fn() },
  };

  return {
    mockWindow,
    mockWm,
    mockMm,
    MockWindowManager,
    MockMenuManager,
    ipcHandlers,
    ipcOnListeners,
    appListeners,
    appMocks,
    toolkitMocks,
  };
});

vi.mock('electron', () => ({
  app: appMocks,
  ipcMain: {
    handle: vi.fn((channel: string, fn: (...args: unknown[]) => unknown) => {
      ipcHandlers.set(channel, fn);
    }),
    on: vi.fn((channel: string, fn: (...args: unknown[]) => void) => {
      const list = ipcOnListeners.get(channel) ?? [];
      list.push(fn);
      ipcOnListeners.set(channel, list);
    }),
  },
  globalShortcut: { unregisterAll: vi.fn() },
  desktopCapturer: {
    getSources: vi.fn().mockResolvedValue([{ id: 'capture-id-1' }]),
  },
}));

vi.mock('./window-manager', () => ({
  WindowManager: MockWindowManager,
}));

vi.mock('./menu-manager', () => ({
  MenuManager: MockMenuManager,
}));

vi.mock('@electron-toolkit/utils', () => toolkitMocks);

describe('main process entry', () => {
  beforeEach(() => {
    vi.resetModules();
    ipcHandlers.clear();
    ipcOnListeners.clear();
    appListeners.clear();
    vi.clearAllMocks();
    mockMm.getConfigFiles.mockReturnValue([]);
    mockWm.getWindow.mockReturnValue(mockWindow as never);
    appMocks.whenReady.mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function loadMain() {
    await import('./index');
    await Promise.resolve();
    await Promise.resolve();
  }

  it('bootstraps window and menu managers when app is ready', async () => {
    await loadMain();
    expect(appMocks.whenReady).toHaveBeenCalled();
    expect(MockWindowManager).toHaveBeenCalled();
    expect(MockMenuManager).toHaveBeenCalled();
    expect(mockWm.createWindow).toHaveBeenCalled();
    expect(mockMm.createTray).toHaveBeenCalled();
    expect(toolkitMocks.electronApp.setAppUserModelId).toHaveBeenCalledWith('com.electron');
  });

  it('registers get-platform handler', async () => {
    await loadMain();
    const fn = ipcHandlers.get('get-platform') as () => string;
    expect(fn).toBeDefined();
    expect(fn()).toBe(process.platform);
  });

  it('registers get-config-files from MenuManager', async () => {
    mockMm.getConfigFiles.mockReturnValue([{ filename: 'c.yaml', name: 'C' }]);
    await loadMain();
    const fn = ipcHandlers.get('get-config-files') as () => unknown;
    expect(fn()).toEqual([{ filename: 'c.yaml', name: 'C' }]);
  });

  it('registers get-screen-capture using desktopCapturer', async () => {
    await loadMain();
    const fn = ipcHandlers.get('get-screen-capture') as () => Promise<string>;
    expect(await fn()).toBe('capture-id-1');
  });

  it('set-ignore-mouse-events calls windowManager when window exists', async () => {
    await loadMain();
    const list = ipcOnListeners.get('set-ignore-mouse-events');
    expect(list?.length).toBeGreaterThan(0);
    const handler = list![0] as (e: unknown, ignore: boolean) => void;
    mockWm.getWindow.mockReturnValue(mockWindow as never);
    handler({}, true);
    expect(mockWm.setIgnoreMouseEvents).toHaveBeenCalledWith(true);
  });

  it('pre-mode-changed updates menu for window and pet', async () => {
    await loadMain();
    const list = ipcOnListeners.get('pre-mode-changed');
    const handler = list![0] as (e: unknown, mode: string) => void;
    handler({}, 'pet');
    expect(mockMm.setMode).toHaveBeenCalledWith('pet');
    handler({}, 'invalid');
    expect(mockMm.setMode).toHaveBeenCalledTimes(1);
  });

  it('before-quit destroys menu and unregisters shortcuts', async () => {
    await loadMain();
    const list = appListeners.get('before-quit');
    expect(list?.length).toBeGreaterThan(0);
    const { globalShortcut } = await import('electron');
    list![0]();
    expect(mockMm.destroy).toHaveBeenCalled();
    expect(globalShortcut.unregisterAll).toHaveBeenCalled();
  });
});
