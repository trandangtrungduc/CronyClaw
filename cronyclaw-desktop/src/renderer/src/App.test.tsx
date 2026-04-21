import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import App from './App';

vi.mock('./services/websocket-handler', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="websocket-handler">{children}</div>,
}));

vi.mock('./components/sidebar/sidebar', () => ({
  default: ({
    isCollapsed,
    onToggle,
  }: {
    isCollapsed: boolean;
    onToggle: () => void;
  }) => (
    <div data-testid="sidebar" data-collapsed={String(isCollapsed)}>
      <button type="button" onClick={onToggle}>toggle-sidebar</button>
    </div>
  ),
}));

vi.mock('./components/footer/footer', () => ({
  default: ({
    isCollapsed,
    onToggle,
  }: {
    isCollapsed: boolean;
    onToggle: () => void;
  }) => (
    <div data-testid="footer" data-collapsed={String(isCollapsed)}>
      <button type="button" onClick={onToggle}>toggle-footer</button>
    </div>
  ),
}));

vi.mock('./components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

vi.mock('./components/canvas/live2d', () => ({
  Live2D: () => <div data-testid="live2d" />,
  useAudioTask: () => ({ addAudioTask: vi.fn() }),
}));

vi.mock('./components/canvas/background', () => ({
  default: () => <div data-testid="background" />,
}));

vi.mock('./components/canvas/ws-status', () => ({
  default: () => <div data-testid="ws-status" />,
}));

vi.mock('./components/canvas/subtitle', () => ({
  default: () => <div data-testid="subtitle" />,
}));

vi.mock('./components/electron/title-bar', () => ({
  default: () => <div data-testid="title-bar" />,
}));

vi.mock('./components/electron/input-subtitle', () => ({
  InputSubtitle: () => <div data-testid="input-subtitle" />,
}));

vi.mock('./context/mode-context', () => ({
  ModeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useMode: () => ({
    mode: (globalThis as any).__appMode,
  }),
}));

function passthroughProvider(children: React.ReactNode) {
  return <>{children}</>;
}

vi.mock('./context/camera-context', () => ({
  CameraProvider: ({ children }: { children: React.ReactNode }) => passthroughProvider(children),
}));
vi.mock('./context/screen-capture-context', () => ({
  ScreenCaptureProvider: ({ children }: { children: React.ReactNode }) => passthroughProvider(children),
}));
vi.mock('./context/character-config-context', () => ({
  CharacterConfigProvider: ({ children }: { children: React.ReactNode }) => passthroughProvider(children),
}));
vi.mock('./context/chat-history-context', () => ({
  ChatHistoryProvider: ({ children }: { children: React.ReactNode }) => passthroughProvider(children),
}));
vi.mock('./context/ai-state-context', () => ({
  AiStateProvider: ({ children }: { children: React.ReactNode }) => passthroughProvider(children),
}));
vi.mock('./context/proactive-speak-context', () => ({
  ProactiveSpeakProvider: ({ children }: { children: React.ReactNode }) => passthroughProvider(children),
}));
vi.mock('./context/live2d-config-context', () => ({
  Live2DConfigProvider: ({ children }: { children: React.ReactNode }) => passthroughProvider(children),
}));
vi.mock('./context/subtitle-context', () => ({
  SubtitleProvider: ({ children }: { children: React.ReactNode }) => passthroughProvider(children),
}));
vi.mock('./context/vad-context', () => ({
  VADProvider: ({ children }: { children: React.ReactNode }) => passthroughProvider(children),
}));
vi.mock('./context/bgurl-context', () => ({
  BgUrlProvider: ({ children }: { children: React.ReactNode }) => passthroughProvider(children),
}));
vi.mock('./context/group-context', () => ({
  GroupProvider: ({ children }: { children: React.ReactNode }) => passthroughProvider(children),
}));
vi.mock('./context/browser-context', () => ({
  BrowserProvider: ({ children }: { children: React.ReactNode }) => passthroughProvider(children),
}));

describe('App', () => {
  beforeEach(() => {
    (globalThis as any).__appMode = 'window';
  });

  it('renders window UI (sidebar/footer/titlebar) and updates collapsed state', () => {
    const { getByTestId } = render(<App />);

    const sidebar = getByTestId('sidebar');
    const footer = getByTestId('footer');

    expect(getByTestId('title-bar')).toBeTruthy();
    expect(getByTestId('live2d')).toBeTruthy();
    expect(sidebar.getAttribute('data-collapsed')).toBe('false');
    expect(footer.getAttribute('data-collapsed')).toBe('false');

    fireEvent.click(getByTestId('sidebar').querySelector('button')!);
    expect(sidebar.getAttribute('data-collapsed')).toBe('true');

    fireEvent.click(getByTestId('footer').querySelector('button')!);
    expect(footer.getAttribute('data-collapsed')).toBe('true');
  });

  it('renders pet mode UI (input subtitle) and hides window UI', () => {
    (globalThis as any).__appMode = 'pet';

    const { queryByTestId, getByTestId } = render(<App />);

    expect(getByTestId('input-subtitle')).toBeTruthy();
    expect(queryByTestId('sidebar')).toBeNull();
    expect(queryByTestId('footer')).toBeNull();
    expect(queryByTestId('title-bar')).toBeNull();
  });
});
