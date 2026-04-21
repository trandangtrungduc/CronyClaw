import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const m = vi.hoisted(() => {
  const exposeInMainWorld = vi.fn();
  const ipcSend = vi.fn();
  const ipcOn = vi.fn();
  const ipcInvoke = vi.fn().mockResolvedValue([{ filename: 'a.yaml', name: 'A' }]);
  const ipcRemoveListener = vi.fn();
  const ipcOnce = vi.fn();
  const getSources = vi.fn().mockResolvedValue([{ id: 'src1', name: 'Screen 1' }]);
  return {
    exposeInMainWorld,
    ipcSend,
    ipcOn,
    ipcInvoke,
    ipcRemoveListener,
    ipcOnce,
    getSources,
  };
});

vi.mock('electron', () => ({
  default: {
    contextBridge: { exposeInMainWorld: m.exposeInMainWorld },
    ipcRenderer: {
      send: m.ipcSend,
      on: m.ipcOn,
      invoke: m.ipcInvoke,
      removeListener: m.ipcRemoveListener,
      once: m.ipcOnce,
    },
    desktopCapturer: { getSources: m.getSources },
  },
}));

vi.mock('@electron-toolkit/preload', () => ({
  electronAPI: { __toolkit: true as const },
}));

async function importPreload(contextIsolated: boolean) {
  vi.stubGlobal('process', { ...process, contextIsolated });
  vi.resetModules();
  await import('./index');
}

function getExposedApi(): Record<string, unknown> {
  const call = m.exposeInMainWorld.mock.calls.find((c) => c[0] === 'api');
  expect(call).toBeDefined();
  return call![1] as Record<string, unknown>;
}

function getExposedElectron(): Record<string, unknown> {
  const call = m.exposeInMainWorld.mock.calls.find((c) => c[0] === 'electron');
  expect(call).toBeDefined();
  return call![1] as Record<string, unknown>;
}

describe('preload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.ipcInvoke.mockResolvedValue([{ filename: 'a.yaml', name: 'A' }]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    delete (window as unknown as { api?: unknown }).api;
    delete (window as unknown as { electron?: unknown }).electron;
  });

  describe('contextIsolation enabled', () => {
    beforeEach(async () => {
      await importPreload(true);
    });

    it('exposes electron and api on the main world', () => {
      expect(m.exposeInMainWorld).toHaveBeenCalledWith(
        'electron',
        expect.objectContaining({ __toolkit: true }),
      );
      expect(m.exposeInMainWorld).toHaveBeenCalledWith('api', expect.any(Object));
    });

    it('electron bridge forwards desktopCapturer.getSources', async () => {
      const electronObj = getExposedElectron();
      const dc = electronObj.desktopCapturer as { getSources: (o: object) => Promise<unknown> };
      const opts = { types: ['screen'] as const };
      const result = await dc.getSources(opts);
      expect(m.getSources).toHaveBeenCalledWith(opts);
      expect(result).toEqual([{ id: 'src1', name: 'Screen 1' }]);
    });

    it('electron bridge ipcRenderer.invoke forwards to ipcRenderer', async () => {
      const electronObj = getExposedElectron();
      const ipc = electronObj.ipcRenderer as { invoke: (ch: string, ...a: unknown[]) => Promise<unknown> };
      m.ipcInvoke.mockResolvedValueOnce('ok');
      await expect(ipc.invoke('chan', 1, 2)).resolves.toBe('ok');
      expect(m.ipcInvoke).toHaveBeenCalledWith('chan', 1, 2);
    });

    it('api.setIgnoreMouseEvents sends ipc', () => {
      const api = getExposedApi();
      (api.setIgnoreMouseEvents as (v: boolean) => void)(true);
      expect(m.ipcSend).toHaveBeenCalledWith('set-ignore-mouse-events', true);
    });

    it('api.toggleForceIgnoreMouse sends ipc', () => {
      const api = getExposedApi();
      (api.toggleForceIgnoreMouse as () => void)();
      expect(m.ipcSend).toHaveBeenCalledWith('toggle-force-ignore-mouse');
    });

    it('api.showContextMenu sends ipc', () => {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const api = getExposedApi();
      (api.showContextMenu as () => void)();
      expect(m.ipcSend).toHaveBeenCalledWith('show-context-menu');
      log.mockRestore();
    });

    it('api.setMode sends pre-mode-changed', () => {
      const api = getExposedApi();
      (api.setMode as (mode: 'window' | 'pet') => void)('pet');
      expect(m.ipcSend).toHaveBeenCalledWith('pre-mode-changed', 'pet');
    });

    it('api.updateComponentHover sends ipc', () => {
      const api = getExposedApi();
      (api.updateComponentHover as (id: string, h: boolean) => void)('x', true);
      expect(m.ipcSend).toHaveBeenCalledWith('update-component-hover', 'x', true);
    });

    it('api.getConfigFiles invokes get-config-files', async () => {
      const api = getExposedApi();
      const out = await (api.getConfigFiles as () => Promise<unknown>)();
      expect(m.ipcInvoke).toHaveBeenCalledWith('get-config-files');
      expect(out).toEqual([{ filename: 'a.yaml', name: 'A' }]);
    });

    it('api.updateConfigFiles sends files', () => {
      const api = getExposedApi();
      const files = [{ filename: 'b.yaml', name: 'B' }];
      (api.updateConfigFiles as (f: typeof files) => void)(files);
      expect(m.ipcSend).toHaveBeenCalledWith('update-config-files', files);
    });

    it('api.onForceIgnoreMouseChanged subscribes and unsubscribe removes listener', () => {
      const api = getExposedApi();
      const cb = vi.fn();
      const unsub = (api.onForceIgnoreMouseChanged as (c: (v: boolean) => void) => () => void)(cb);
      expect(m.ipcOn).toHaveBeenCalledWith('force-ignore-mouse-changed', expect.any(Function));
      const handler = m.ipcOn.mock.calls.find((c) => c[0] === 'force-ignore-mouse-changed')![1] as (
        e: unknown,
        v: boolean,
      ) => void;
      handler({}, true);
      expect(cb).toHaveBeenCalledWith(true);
      unsub();
      expect(m.ipcRemoveListener).toHaveBeenCalledWith('force-ignore-mouse-changed', handler);
    });

    it('api.onMicToggle returns unsubscribe', () => {
      const api = getExposedApi();
      const cb = vi.fn();
      const unsub = (api.onMicToggle as (c: () => void) => () => void)(cb);
      const handler = m.ipcOn.mock.calls.find((c) => c[0] === 'mic-toggle')![1] as () => void;
      handler();
      expect(cb).toHaveBeenCalled();
      unsub();
      expect(m.ipcRemoveListener).toHaveBeenCalledWith('mic-toggle', handler);
    });
  });

  describe('contextIsolation disabled', () => {
    beforeEach(async () => {
      await importPreload(false);
    });

    it('assigns api and electron on window', () => {
      expect(m.exposeInMainWorld).not.toHaveBeenCalled();
      expect((window as unknown as { api: unknown }).api).toBeDefined();
      expect((window as unknown as { electron: unknown }).electron).toEqual(
        expect.objectContaining({ __toolkit: true }),
      );
    });

    it('window.api forwards ipc like isolated bridge', () => {
      const api = (window as unknown as { api: Record<string, unknown> }).api;
      (api.setMode as (m: 'window' | 'pet') => void)('window');
      expect(m.ipcSend).toHaveBeenCalledWith('pre-mode-changed', 'window');
    });
  });
});
