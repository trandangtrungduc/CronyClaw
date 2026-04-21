import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import Footer from './footer';

const handleMicToggle = vi.fn();
const handleInterrupt = vi.fn();
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

vi.mock('@/hooks/footer/use-footer', () => ({
  useFooter: vi.fn(() => ({
    inputValue: 'draft',
    handleInputChange,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    handleInterrupt,
    handleMicToggle,
    micOn: true,
    slashAssist,
  })),
}));

vi.mock('./ai-state-indicator', () => ({
  default: () => <div data-testid="ai-indicator" />,
}));

vi.mock('@/components/ui/slash-command-ui', () => ({
  SlashCommandUi: () => null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => `t:${k}` }),
}));

function wrap(node: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{node}</ChakraProvider>);
}

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders AI indicator and message field', () => {
    wrap(<Footer />);
    expect(screen.getByTestId('ai-indicator')).toBeTruthy();
    expect(screen.getByPlaceholderText('t:footer.typeYourMessage')).toHaveValue('draft');
  });

  it('calls onToggle when collapse control is clicked', () => {
    const onToggle = vi.fn();
    const { container } = wrap(<Footer onToggle={onToggle} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    fireEvent.click(svg!.parentElement!);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('invokes mic and interrupt handlers from action buttons', () => {
    wrap(<Footer />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Raise hand' }));
    expect(handleMicToggle).toHaveBeenCalledTimes(1);
    expect(handleInterrupt).toHaveBeenCalledTimes(1);
  });

  it('still renders input when collapsed', () => {
    wrap(<Footer isCollapsed />);
    expect(screen.getByPlaceholderText('t:footer.typeYourMessage')).toBeTruthy();
  });
});
