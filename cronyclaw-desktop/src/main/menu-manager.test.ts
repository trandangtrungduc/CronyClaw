import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../resources/icon.png?asset', () => ({ default: 'icon.png' }), { virtual: true });

const trayInstances: { destroy: ReturnType<typeof vi.fn>; setContextMenu: ReturnType<typeof vi.fn>; setToolTip: ReturnType<typeof vi.fn> }[] = [];

vi.mock('electron', () => ({
  Tray: vi.fn(function MockTray() {
    const inst = {
      destroy: vi.fn(),
      setContextMenu: vi.fn(),
      setToolTip: vi.fn(),
    };
    trayInstances.push(inst);
    return inst;
  }),
  Menu: {
    buildFromTemplate: vi.fn(() => ({
      popup: vi.fn(),
    })),
  },
  nativeImage: {
    createFromPath: () => ({
      resize: () => ({}),
    }),
  },
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
    fromWebContents: vi.fn(() => ({
      webContents: {},
    })),
  },
  ipcMain: {
    on: vi.fn(),
    handle: vi.fn(),
  },
  screen: {
    getCursorScreenPoint: () => ({ x: 100, y: 200 }),
  },
  app: {
    quit: vi.fn(),
  },
}));

import { MenuManager } from './menu-manager';
import type { ConfigFile } from './menu-manager';
import { ipcMain, Menu, BrowserWindow } from 'electron';

describe('MenuManager', () => {
  beforeEach(() => {
    trayInstances.length = 0;
    vi.clearAllMocks();
  });

  it('starts with empty config files', () => {
    const mm = new MenuManager(vi.fn());
    expect(mm.getConfigFiles()).toEqual([]);
  });

  it('updates and returns config file list', () => {
    const mm = new MenuManager(vi.fn());
    const files: ConfigFile[] = [
      { filename: 'a.yaml', name: 'A' },
      { filename: 'b.yaml', name: 'B' },
    ];
    mm.updateConfigFiles(files);
    expect(mm.getConfigFiles()).toEqual(files);
  });

  it('setMode invokes onModeChange', () => {
    const onMode = vi.fn();
    const mm = new MenuManager(onMode);
    mm.setMode('pet');
    expect(onMode).toHaveBeenCalledWith('pet');
    mm.setMode('window');
    expect(onMode).toHaveBeenCalledWith('window');
  });

  it('createTray builds tray with tooltip and context menu', () => {
    const mm = new MenuManager(vi.fn());
    mm.createTray();
    expect(trayInstances.length).toBe(1);
    expect(trayInstances[0].setToolTip).toHaveBeenCalledWith('CronyClaw');
    expect(trayInstances[0].setContextMenu).toHaveBeenCalled();
    expect(Menu.buildFromTemplate).toHaveBeenCalled();
  });

  it('destroy clears tray', () => {
    const mm = new MenuManager(vi.fn());
    mm.createTray();
    const tray = trayInstances[0];
    mm.destroy();
    expect(tray.destroy).toHaveBeenCalled();
  });

  it('registers show-context-menu ipc handler', () => {
    new MenuManager(vi.fn());
    expect(ipcMain.on).toHaveBeenCalledWith('show-context-menu', expect.any(Function));
  });

  it('show-context-menu handler builds popup when window exists', () => {
    new MenuManager(vi.fn());
    const call = vi.mocked(ipcMain.on).mock.calls.find((c) => c[0] === 'show-context-menu');
    expect(call).toBeDefined();
    const handler = call![1] as (event: Electron.IpcMainEvent) => void;
    const popup = vi.fn();
    vi.mocked(Menu.buildFromTemplate).mockReturnValueOnce({ popup } as unknown as Electron.Menu);
    vi.mocked(BrowserWindow.fromWebContents).mockReturnValueOnce({
      webContents: {},
    } as unknown as Electron.BrowserWindow);
    handler({
      sender: {} as Electron.WebContents,
    } as Electron.IpcMainEvent);
    expect(Menu.buildFromTemplate).toHaveBeenCalled();
    expect(popup).toHaveBeenCalledWith(
      expect.objectContaining({
        x: 100,
        y: 200,
      }),
    );
  });
});
