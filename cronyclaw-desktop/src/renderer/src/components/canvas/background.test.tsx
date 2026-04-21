import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import Background from './background';

const startBackgroundCamera = vi.fn();
const stopBackgroundCamera = vi.fn();

const mockUseCamera = vi.fn(() => ({
  backgroundStream: null as MediaStream | null,
  isBackgroundStreaming: false,
  startBackgroundCamera,
  stopBackgroundCamera,
}));

const mockUseBgUrl = vi.fn(() => ({
  useCameraBackground: false,
  backgroundUrl: 'https://example.com/bg.png',
  setBackgroundUrl: vi.fn(),
  backgroundFiles: [],
  setBackgroundFiles: vi.fn(),
  resetBackground: vi.fn(),
  addBackgroundFile: vi.fn(),
  removeBackgroundFile: vi.fn(),
  isDefaultBackground: true,
  setUseCameraBackground: vi.fn(),
}));

vi.mock('@/context/camera-context', () => ({
  useCamera: () => mockUseCamera(),
}));

vi.mock('@/context/bgurl-context', () => ({
  useBgUrl: () => mockUseBgUrl(),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Background', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCamera.mockImplementation(() => ({
      backgroundStream: null,
      isBackgroundStreaming: false,
      startBackgroundCamera,
      stopBackgroundCamera,
    }));
    mockUseBgUrl.mockImplementation(() => ({
      useCameraBackground: false,
      backgroundUrl: 'https://example.com/bg.png',
      setBackgroundUrl: vi.fn(),
      backgroundFiles: [],
      setBackgroundFiles: vi.fn(),
      resetBackground: vi.fn(),
      addBackgroundFile: vi.fn(),
      removeBackgroundFile: vi.fn(),
      isDefaultBackground: true,
      setUseCameraBackground: vi.fn(),
    }));
  });

  it('renders static image when camera background is off', () => {
    wrap(<Background />);
    const img = screen.getByRole('img', { name: 'background' });
    expect(img).toHaveAttribute('src', 'https://example.com/bg.png');
    expect(document.querySelector('video')).toBeNull();
  });

  it('starts camera when useCameraBackground becomes true', () => {
    mockUseBgUrl.mockImplementation(() => ({
      useCameraBackground: true,
      backgroundUrl: '',
      setBackgroundUrl: vi.fn(),
      backgroundFiles: [],
      setBackgroundFiles: vi.fn(),
      resetBackground: vi.fn(),
      addBackgroundFile: vi.fn(),
      removeBackgroundFile: vi.fn(),
      isDefaultBackground: true,
      setUseCameraBackground: vi.fn(),
    }));
    wrap(<Background />);
    expect(startBackgroundCamera).toHaveBeenCalled();
    expect(stopBackgroundCamera).not.toHaveBeenCalled();
  });

  it('stops camera when useCameraBackground is false', () => {
    wrap(<Background />);
    expect(stopBackgroundCamera).toHaveBeenCalled();
  });

  it('renders video element when camera background is on', () => {
    mockUseBgUrl.mockImplementation(() => ({
      useCameraBackground: true,
      backgroundUrl: '',
      setBackgroundUrl: vi.fn(),
      backgroundFiles: [],
      setBackgroundFiles: vi.fn(),
      resetBackground: vi.fn(),
      addBackgroundFile: vi.fn(),
      removeBackgroundFile: vi.fn(),
      isDefaultBackground: true,
      setUseCameraBackground: vi.fn(),
    }));
    mockUseCamera.mockImplementation(() => ({
      backgroundStream: null,
      isBackgroundStreaming: true,
      startBackgroundCamera,
      stopBackgroundCamera,
    }));
    wrap(<Background />);
    const video = document.querySelector('video');
    expect(video).not.toBeNull();
    expect(video).toHaveStyle({ display: 'block' });
  });
});
