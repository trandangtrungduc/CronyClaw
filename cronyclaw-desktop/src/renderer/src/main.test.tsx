import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function AppMock() {
  return <div data-testid="app-mock" />;
}

vi.mock('./App', () => ({
  default: AppMock,
}));

vi.mock('react-dom/client', () => {
  const render = vi.fn();
  const createRoot = vi.fn(() => ({ render }));
  (globalThis as any).__mainCreateRootMock = createRoot;
  (globalThis as any).__mainRenderSpy = render;
  return { createRoot };
});

vi.mock('../WebSDK/src/lappadapter', () => ({
  LAppAdapter: {
    getInstance: vi.fn(() => ({ __lapp: true })),
  },
}));

vi.mock('./index.css', () => ({}));
vi.mock('./i18n', () => ({}));

describe('main', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    delete (globalThis as any).__mainCreateRootMock;
    delete (globalThis as any).__mainRenderSpy;
  });

  it('renders App into #root and applies console suppression rules', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'script') {
        return {
          onload: null,
          onerror: null,
          set src(_v: string) {},
        } as any;
      }
      return originalCreateElement(tagName);
    });

    const appendChildSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((el: any) => {
      if (el && typeof el.onload === 'function') el.onload();
      return el;
    });

    await import('./main');
    await new Promise((r) => setTimeout(r, 0));

    const createRootMock = (globalThis as any).__mainCreateRootMock;
    const renderSpy = (globalThis as any).__mainRenderSpy;

    expect(createRootMock).toHaveBeenCalledTimes(1);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    const renderedEl = renderSpy.mock.calls[0][0];
    expect(renderedEl.type).toBe(AppMock);

    console.warn('onnxruntime backend warning');
    expect(warnSpy).toHaveBeenCalledTimes(0);

    console.warn('other warning');
    expect(warnSpy).toHaveBeenCalledTimes(1);

    console.error('Warning: Failed something');
    expect(errorSpy).toHaveBeenCalledTimes(0);

    console.error('Other error');
    expect(errorSpy).toHaveBeenCalledTimes(1);

    appendChildSpy.mockRestore();
    createElementSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
