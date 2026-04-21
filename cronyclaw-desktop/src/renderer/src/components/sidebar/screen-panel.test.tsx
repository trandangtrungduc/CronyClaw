import type { ReactNode } from 'react';
import { createRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import ScreenPanel from './screen-panel';

const mockUseCaptureScreen = vi.fn();

vi.mock('@/hooks/sidebar/use-capture-screen', () => ({
  useCaptureScreen: () => mockUseCaptureScreen(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => `t:${k}` }),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('ScreenPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCaptureScreen.mockImplementation(() => ({
      videoRef: createRef<HTMLVideoElement>(),
      error: null as string | null,
      isHovering: false,
      isStreaming: false,
      toggleCapture: vi.fn(),
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
    }));
  });

  it('shows control tooltip copy when idle', () => {
    wrap(<ScreenPanel />);
    expect(screen.getByText('t:footer.screenControl')).not.toBeNull();
  });

  it('shows capture error when hook reports error', () => {
    mockUseCaptureScreen.mockImplementation(() => ({
      videoRef: createRef<HTMLVideoElement>(),
      error: 'Denied',
      isHovering: false,
      isStreaming: false,
      toggleCapture: vi.fn(),
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
    }));
    wrap(<ScreenPanel />);
    expect(screen.getByText('Denied')).not.toBeNull();
  });

  it('calls toggleCapture when screen area is clicked', () => {
    const toggleCapture = vi.fn();
    mockUseCaptureScreen.mockImplementation(() => ({
      videoRef: createRef<HTMLVideoElement>(),
      error: null,
      isHovering: false,
      isStreaming: false,
      toggleCapture,
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
    }));
    wrap(<ScreenPanel />);
    const hint = screen.getByText('t:footer.screenControl');
    fireEvent.click(hint.parentElement!.parentElement!);
    expect(toggleCapture).toHaveBeenCalledTimes(1);
  });
});
