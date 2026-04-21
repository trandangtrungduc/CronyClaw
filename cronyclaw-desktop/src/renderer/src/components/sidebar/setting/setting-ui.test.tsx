import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import SettingUI from './setting-ui';

vi.mock('./general', () => ({ default: () => <div data-testid="tab-general" /> }));
vi.mock('./live2d', () => ({ default: () => <div data-testid="tab-live2d" /> }));
vi.mock('./asr', () => ({ default: () => <div data-testid="tab-asr" /> }));
vi.mock('./tts', () => ({ default: () => <div data-testid="tab-tts" /> }));
vi.mock('./agent', () => ({ default: () => <div data-testid="tab-agent" /> }));
vi.mock('./about', () => ({ default: () => <div data-testid="tab-about" /> }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => `t:${k}` }),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('SettingUI', () => {
  it('shows settings title and tab labels when open', async () => {
    await act(async () => {
      wrap(
        <SettingUI open onClose={vi.fn()} onToggle={vi.fn()} />,
      );
    });
    expect(screen.getByText('t:common.settings')).not.toBeNull();
    expect(screen.getByText('t:settings.tabs.general')).not.toBeNull();
    expect(screen.getByText('t:settings.tabs.about')).not.toBeNull();
    expect(screen.getByText('t:common.save')).not.toBeNull();
    expect(screen.getByText('t:common.cancel')).not.toBeNull();
  });
});
