import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaCapture } from './use-media-capture';

beforeEach(() => {
  localStorage.clear();
  (globalThis as any).__mediaCaptureToasterCreateMock = vi.fn();
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, opts?: any) => {
      if (opts?.source) return `${k}:${opts.source}`;
      return k;
    },
  }),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: (...args: any[]) => (globalThis as any).__mediaCaptureToasterCreateMock(...args),
  },
}));

vi.mock('@/context/camera-context', () => ({
  useCamera: () => ({
    stream: (globalThis as any).__mediaCaptureCameraStream,
  }),
}));

vi.mock('@/context/screen-capture-context', () => ({
  useScreenCaptureContext: () => ({
    stream: (globalThis as any).__mediaCaptureScreenStream,
  }),
}));

vi.mock('@/hooks/sidebar/setting/use-general-settings', () => ({
  IMAGE_COMPRESSION_QUALITY_KEY: 'appImageCompressionQuality',
  DEFAULT_IMAGE_COMPRESSION_QUALITY: 0.8,
  IMAGE_MAX_WIDTH_KEY: 'appImageMaxWidth',
  DEFAULT_IMAGE_MAX_WIDTH: 0,
}));

class FakeImageCapture {
  private track: any;

  constructor(track: any) {
    this.track = track;
  }

  async grabFrame() {
    if ((globalThis as any).__mediaCaptureFailTrackId === this.track?.id) {
      throw new Error('grab fail');
    }
    return (globalThis as any).__mediaCaptureBitmap;
  }
}

vi.stubGlobal('ImageCapture', FakeImageCapture);

function makeCanvasMock() {
  const ctx = { drawImage: vi.fn() };
  const canvas = {
    width: 0,
    height: 0,
    style: {},
    getContext: () => ctx,
    toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,abc'),
  } as any;
  return { canvas, ctx };
}

describe('useMediaCapture', () => {
  beforeEach(() => {
    (globalThis as any).__mediaCaptureCameraStream = {
      getVideoTracks: () => [{ id: 'cam-track' }],
    };
    (globalThis as any).__mediaCaptureScreenStream = {
      getVideoTracks: () => [{ id: 'screen-track' }],
    };

    (globalThis as any).__mediaCaptureBitmap = {
      width: 200,
      height: 100,
    };

    (globalThis as any).__mediaCaptureFailTrackId = null;

    const { canvas, ctx } = makeCanvasMock();
    (globalThis as any).__mediaCaptureCanvas = canvas;
    (globalThis as any).__mediaCaptureCtx = ctx;

    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: any) => {
      if (tag === 'canvas') return canvas;
      return originalCreateElement(tag);
    });

    (globalThis as any).__mediaCaptureCanvasCreateSpy = createElementSpy;
  });

  it('captures both camera and screen frames and applies maxWidth + quality', async () => {
    localStorage.setItem('appImageCompressionQuality', '0.5');
    localStorage.setItem('appImageMaxWidth', '50');

    const { result } = renderHook(() => useMediaCapture());

    await act(async () => {
      const images = await result.current.captureAllMedia();
      expect(images).toHaveLength(2);
      expect(images[0].source).toBe('camera');
      expect(images[0].mime_type).toBe('image/jpeg');
      expect(images[1].source).toBe('screen');
      expect(images[1].mime_type).toBe('image/jpeg');
    });

    const canvas = (globalThis as any).__mediaCaptureCanvas;
    const ctx = (globalThis as any).__mediaCaptureCtx;
    expect(canvas.width).toBe(50);
    expect(canvas.height).toBe(25);
    expect(canvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.5);
    expect(ctx.drawImage).toHaveBeenCalled();
  });

  it('shows toast and returns only successfully captured frames when a capture fails', async () => {
    (globalThis as any).__mediaCaptureCameraStream = {
      getVideoTracks: () => [{ id: 'cam-track' }],
    };

    (globalThis as any).__mediaCaptureFailTrackId = 'cam-track';

    const { result } = renderHook(() => useMediaCapture());

    const images = await act(async () => result.current.captureAllMedia());
    expect(images).toHaveLength(1);
    expect(images[0].source).toBe('screen');
    expect((globalThis as any).__mediaCaptureToasterCreateMock).toHaveBeenCalled();
  });

  afterEach(() => {
    const createElementSpy = (globalThis as any).__mediaCaptureCanvasCreateSpy;
    if (createElementSpy) createElementSpy.mockRestore();
    (globalThis as any).__mediaCaptureCanvasCreateSpy = null;
  });
});
