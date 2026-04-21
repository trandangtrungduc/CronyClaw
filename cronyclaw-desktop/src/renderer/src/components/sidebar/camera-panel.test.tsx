import type { ReactNode } from 'react';
import { createRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import CameraPanel from './camera-panel';

const mockUseCameraPanel = vi.fn();

vi.mock('@/hooks/sidebar/use-camera-panel', () => ({
  useCameraPanel: () => mockUseCameraPanel(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => `t:${k}` }),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('CameraPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCameraPanel.mockImplementation(() => ({
      videoRef: createRef<HTMLVideoElement>(),
      error: null as string | null,
      isHovering: false,
      isStreaming: false,
      stream: null as MediaStream | null,
      toggleCamera: vi.fn(),
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
    }));
  });

  it('shows placeholder copy when not streaming and no error', () => {
    wrap(<CameraPanel />);
    expect(screen.getByText('t:footer.cameraControl')).not.toBeNull();
  });

  it('shows error text when hook reports error', () => {
    mockUseCameraPanel.mockImplementation(() => ({
      videoRef: createRef<HTMLVideoElement>(),
      error: 'No device',
      isHovering: false,
      isStreaming: false,
      stream: null,
      toggleCamera: vi.fn(),
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
    }));
    wrap(<CameraPanel />);
    expect(screen.getByText('No device')).not.toBeNull();
  });

  it('calls toggleCamera when video area is clicked', () => {
    const toggleCamera = vi.fn();
    mockUseCameraPanel.mockImplementation(() => ({
      videoRef: createRef<HTMLVideoElement>(),
      error: null,
      isHovering: false,
      isStreaming: false,
      stream: null,
      toggleCamera,
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
    }));
    wrap(<CameraPanel />);
    const hint = screen.getByText('t:footer.cameraControl');
    fireEvent.click(hint.parentElement!.parentElement!);
    expect(toggleCamera).toHaveBeenCalledTimes(1);
  });
});
