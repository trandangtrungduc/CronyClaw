import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { InputSubtitle } from './input-subtitle';

const handleMicToggle = vi.fn();
const handleInterrupt = vi.fn();
const handleSend = vi.fn();
const handleInputChange = vi.fn();
const handleKeyPress = vi.fn();
const handleCompositionStart = vi.fn();
const handleCompositionEnd = vi.fn();

const slashAssist = {
  recognized: null,
  menuOpen: false,
  items: [] as { id: string; label: string; description: string }[],
  highlightIndex: 0,
  onItemHover: vi.fn(),
  onPickItem: vi.fn(),
};

const mockUseInputSubtitle = vi.fn(() => ({
  inputValue: 'hello',
  handleInputChange,
  handleKeyPress,
  handleCompositionStart,
  handleCompositionEnd,
  handleInterrupt,
  handleMicToggle,
  handleSend,
  lastAIMessage: 'Last reply',
  hasAIMessages: true,
  aiState: 'idle',
  micOn: true,
  slashAssist,
}));

const mockUseMode = vi.fn(() => ({ mode: 'window' as const }));

vi.mock('@/hooks/electron/use-input-subtitle', () => ({
  useInputSubtitle: () => mockUseInputSubtitle(),
}));

vi.mock('@/context/mode-context', () => ({
  useMode: () => mockUseMode(),
}));

vi.mock('@/hooks/electron/use-draggable', () => ({
  useDraggable: () => ({
    elementRef: { current: null },
    isDragging: false,
    handleMouseDown: vi.fn(),
    handleMouseEnter: vi.fn(),
    handleMouseLeave: vi.fn(),
  }),
}));

vi.mock('@/components/ui/slash-command-ui', () => ({
  SlashCommandUi: () => null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

function wrap(node: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{node}</ChakraProvider>);
}

describe('InputSubtitle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMode.mockImplementation(() => ({ mode: 'window' }));
    mockUseInputSubtitle.mockImplementation(() => ({
      inputValue: 'hello',
      handleInputChange,
      handleKeyPress,
      handleCompositionStart,
      handleCompositionEnd,
      handleInterrupt,
      handleMicToggle,
      handleSend,
      lastAIMessage: 'Last reply',
      hasAIMessages: true,
      aiState: 'idle',
      micOn: true,
      slashAssist,
    }));
    delete (window as unknown as { inputSubtitle?: unknown }).inputSubtitle;
  });

  afterEach(() => {
    delete (window as unknown as { inputSubtitle?: unknown }).inputSubtitle;
  });

  it('renders AI message, state, input and actions', () => {
    wrap(<InputSubtitle />);
    expect(screen.queryByText('Last reply')).not.toBeNull();
    expect(screen.queryByText('idle')).not.toBeNull();
    expect(screen.getByPlaceholderText('Type your message...')).toHaveValue('hello');
  });

  it('exposes open and close on window while mounted', () => {
    wrap(<InputSubtitle />);
    expect((window as unknown as { inputSubtitle?: { open: () => void; close: () => void } }).inputSubtitle).toBeDefined();
    expect(typeof (window as unknown as { inputSubtitle: { open: () => void } }).inputSubtitle.open).toBe(
      'function',
    );
  });

  it('calls handleMicToggle and handleInterrupt', () => {
    wrap(<InputSubtitle />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle microphone' }));
    fireEvent.click(screen.getByRole('button', { name: 'Interrupt' }));
    expect(handleMicToggle).toHaveBeenCalledTimes(1);
    expect(handleInterrupt).toHaveBeenCalledTimes(1);
  });

  it('calls handleSend when send control is used', () => {
    wrap(<InputSubtitle />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    expect(handleSend).toHaveBeenCalled();
  });

  it('in pet mode close notifies hover api and unmounts panel', () => {
    const api = window.api as unknown as { updateComponentHover: ReturnType<typeof vi.fn> };
    mockUseMode.mockImplementation(() => ({ mode: 'pet' }));
    wrap(<InputSubtitle />);
    fireEvent.click(screen.getByRole('button', { name: 'Close subtitle' }));
    expect(api.updateComponentHover).toHaveBeenCalledWith('input-subtitle', false);
    expect(screen.queryByPlaceholderText('Type your message...')).toBeNull();
  });

  it('subscribes to onToggleInputSubtitle in pet mode', () => {
    const unsub = vi.fn();
    const api = window.api as unknown as {
      onToggleInputSubtitle: ReturnType<typeof vi.fn>;
    };
    vi.mocked(api.onToggleInputSubtitle).mockReturnValue(unsub);
    mockUseMode.mockImplementation(() => ({ mode: 'pet' }));
    const { unmount } = wrap(<InputSubtitle />);
    expect(api.onToggleInputSubtitle).toHaveBeenCalled();
    unmount();
    expect(unsub).toHaveBeenCalled();
  });
});
