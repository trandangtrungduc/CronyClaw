import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { SlashCommandUi, type SlashAssistUi } from './slash-command-ui';
import type { SlashCommand } from '@/config/slash-commands';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { command?: string }) => {
      if (opts?.command) return `${key}:${opts.command}`;
      return key;
    },
  }),
}));

describe('SlashCommandUi', () => {
  it('returns null when not recognized and menu is closed', () => {
    const assist: SlashAssistUi = {
      recognized: null,
      menuOpen: false,
      items: [],
      highlightIndex: 0,
      onItemHover: vi.fn(),
      onPickItem: vi.fn(),
    };
    const { container } = wrap(<SlashCommandUi assist={assist} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders recognition badge when recognized is provided', () => {
    const cmd: SlashCommand = {
      id: 'openclaw',
      label: 'OpenClaw CLI',
      description: 'Run OpenClaw CLI via companion (tool exec)',
    };
    const assist: SlashAssistUi = {
      recognized: cmd,
      menuOpen: false,
      items: [],
      highlightIndex: 0,
      onItemHover: vi.fn(),
      onPickItem: vi.fn(),
    };

    wrap(<SlashCommandUi assist={assist} />);
    expect(screen.getByText(`footer.slashCommandMode:${cmd.label}`)).not.toBeNull();
  });

  it('renders menu items and calls onPickItem on click', () => {
    const cmd1: SlashCommand = {
      id: 'openclaw',
      label: 'OpenClaw CLI',
      description: 'Run OpenClaw CLI via companion (tool exec)',
    };
    const cmd2: SlashCommand = {
      id: 'blender',
      label: 'Blender',
      description: 'Blender / MCP workflows (reserved)',
    };

    const onPickItem = vi.fn();
    const onItemHover = vi.fn();
    const assist: SlashAssistUi = {
      recognized: null,
      menuOpen: true,
      items: [cmd1, cmd2],
      highlightIndex: 0,
      onItemHover,
      onPickItem,
    };

    wrap(<SlashCommandUi assist={assist} />);
    expect(screen.getByText(cmd1.description)).not.toBeNull();
    expect(screen.getByText(cmd2.description)).not.toBeNull();

    const item = screen.getByText(cmd2.description);
    const itemBox = item.closest('div');
    if (itemBox) {
      fireEvent.mouseEnter(itemBox);
    }
    fireEvent.click(item);
    expect(onPickItem).toHaveBeenCalledWith(cmd2);
  });
});
