import '@testing-library/jest-dom/vitest';
import { vi, beforeEach, afterEach } from 'vitest';

{
  const raw = process.env.NODE_OPTIONS;
  if (typeof raw === 'string' && raw.length > 0) {
    const next = raw.split(/\s+/).filter(Boolean).filter((p) => !p.startsWith('--localstorage-file')).join(' ').trim();
    process.env.NODE_OPTIONS = next;
  }
}

function argSliceToText(args: any[]): string {
  return args.map((a) => {
    if (typeof a === 'string') return a;
    if (a instanceof Error) return a.message;
    try {
      return String(a);
    } catch {
      return '';
    }
  }).join(' ');
}

const __consoleLog = console.log.bind(console);
const __consoleError = console.error.bind(console);
const __consoleWarn = console.warn.bind(console);

console.log = (...args: any[]) => {
  const blob = argSliceToText(args);
  if (
    blob.includes('Live2DDebug')
    || blob.includes('images:')
    || blob.includes('[ContextMenu]')
    || blob.includes('Adding audio task')
    || blob.includes('Skipping audio task')
    || blob.includes('Skipping character switch')
    || blob.includes('Switch Character fileName')
    || blob.includes('locize.com')
    || blob.includes('Reset expression to default:')
    || blob.includes('Model or model settings not loaded yet')
    || blob.includes('Failed to reset expression:')
    || blob.includes('Interrupting conversation chain')
    || blob.includes('Interrupted!')
    || blob.includes('Force ignore mouse changed:')
    || blob.includes('Received message from server:')
    || blob === 'ok'
  ) {
    return;
  }
  __consoleLog(...args);
};

function isProviderBoundaryTestNoise(args: any[], blob: string): boolean {
  if (/must be used within a \w+Provider/.test(blob)) return true;
  if (/The above error occurred in the <Broken>/.test(blob)) return true;
  if (/Consider adding an error boundary to your tree/.test(blob)) return true;
  return args.some(
    (a) => a instanceof Error && /must be used within a \w+Provider/.test(a.message),
  );
}

console.error = (...args: any[]) => {
  const msg = argSliceToText(args);
  if (
    isProviderBoundaryTestNoise(args, msg)
    || msg.includes('Error capturing')
    || msg.includes('Failed to parse WebSocket message')
    || msg.includes('The tag <path> is unrecognized')
  ) {
    return;
  }
  __consoleError(...args);
};

console.warn = (...args: any[]) => {
  const msg = argSliceToText(args);
  if (
    msg.startsWith('The above error occurred in the <Broken>')
    || msg.startsWith('Consider adding an error boundary to your tree')
    || msg.includes('not wrapped in act(')
    || msg.includes('The tag <path> is unrecognized')
    || msg.includes('[Resize] Width or Height is zero')
  ) {
    return;
  }
  __consoleWarn(...args);
};

class InMemoryLocalStorage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    const v = this.store.get(key);
    return v === undefined ? null : v;
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

const __safeLocalStorage: Storage = ((): Storage => {
  const ls = window.localStorage;
  const ok =
    typeof (ls as any)?.clear === 'function'
    && typeof (ls as any)?.getItem === 'function'
    && typeof (ls as any)?.setItem === 'function';

  if (ok) return ls;
  return new InMemoryLocalStorage() as any;
})();

function restoreLocalStorageIfNeeded() {
  const needsRestore =
    typeof window.localStorage?.clear !== 'function' ||
    typeof (globalThis as any).localStorage?.clear !== 'function' ||
    typeof window.localStorage?.getItem !== 'function' ||
    typeof window.localStorage?.setItem !== 'function';

  if (needsRestore) {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: __safeLocalStorage,
    });
    (globalThis as any).localStorage = __safeLocalStorage;
  }
}

beforeEach(() => {
  restoreLocalStorageIfNeeded();
});

afterEach(() => {
  restoreLocalStorageIfNeeded();
});

if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event) => {
      const err = (event as ErrorEvent).error;
      if (err instanceof Error && /must be used within a \w+Provider/.test(err.message)) {
        event.preventDefault();
      }
    },
    true,
  );
}

Object.defineProperty(window, 'api', {
  configurable: true,
  writable: true,
  value: {
    setIgnoreMouseEvents: vi.fn(),
    toggleForceIgnoreMouse: vi.fn(),
    onForceIgnoreMouseChanged: vi.fn(() => () => {}),
    showContextMenu: vi.fn(),
    onModeChanged: vi.fn(),
    onMicToggle: vi.fn(() => () => {}),
    onInterrupt: vi.fn(() => () => {}),
    updateComponentHover: vi.fn(),
    onToggleInputSubtitle: vi.fn(() => () => {}),
    onToggleScrollToResize: vi.fn(() => () => {}),
    onSwitchCharacter: vi.fn(() => () => {}),
    setMode: vi.fn(),
    getConfigFiles: vi.fn().mockResolvedValue([]),
    updateConfigFiles: vi.fn(),
  },
});

Object.defineProperty(window, 'electron', {
  configurable: true,
  writable: true,
  value: {
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
  },
});

vi.mock('@/services/websocket-service', () => {
  const wsService = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendMessage: vi.fn(),
    onMessage: vi.fn(() => ({ unsubscribe: vi.fn() })),
    onStateChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
    getCurrentState: vi.fn(() => 'CLOSED' as const),
  };
  return { wsService };
});

vi.mock('@/components/ui/toaster', () => ({
  toaster: { create: vi.fn() },
}));
