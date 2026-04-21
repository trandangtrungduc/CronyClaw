import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import Subtitle from './subtitle';

const mockDisplay = vi.fn(() => ({
  subtitleText: 'Hello',
  isLoaded: true,
}));

const mockSubtitleCtx = vi.fn(() => ({
  showSubtitle: true,
  subtitleText: 'Hello',
  setSubtitleText: vi.fn(),
  setShowSubtitle: vi.fn(),
}));

vi.mock('@/hooks/canvas/use-subtitle-display', () => ({
  useSubtitleDisplay: () => mockDisplay(),
}));

vi.mock('@/context/subtitle-context', () => ({
  useSubtitle: () => mockSubtitleCtx(),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('Subtitle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDisplay.mockImplementation(() => ({
      subtitleText: 'Hello',
      isLoaded: true,
    }));
    mockSubtitleCtx.mockImplementation(() => ({
      showSubtitle: true,
      subtitleText: 'Hello',
      setSubtitleText: vi.fn(),
      setShowSubtitle: vi.fn(),
    }));
  });

  it('renders subtitle text when visible', () => {
    wrap(<Subtitle />);
    expect(screen.queryByText('Hello')).not.toBeNull();
  });

  it('returns null when not loaded', () => {
    mockDisplay.mockImplementation(() => ({
      subtitleText: 'Hello',
      isLoaded: false,
    }));
    const { container } = wrap(<Subtitle />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when showSubtitle is false', () => {
    mockSubtitleCtx.mockImplementation(() => ({
      showSubtitle: false,
      subtitleText: 'Hello',
      setSubtitleText: vi.fn(),
      setShowSubtitle: vi.fn(),
    }));
    const { container } = wrap(<Subtitle />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when subtitle text empty', () => {
    mockDisplay.mockImplementation(() => ({
      subtitleText: '',
      isLoaded: true,
    }));
    const { container } = wrap(<Subtitle />);
    expect(container.firstChild).toBeNull();
  });
});
