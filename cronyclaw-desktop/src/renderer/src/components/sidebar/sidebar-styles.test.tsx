import { describe, it, expect } from 'vitest';
import { sidebarStyles } from './sidebar-styles';

describe('sidebarStyles', () => {
  it('sidebar container applies collapsed transform and width', () => {
    const expanded = sidebarStyles.sidebar.container(false);
    const collapsed = sidebarStyles.sidebar.container(true);
    expect(expanded.width).toBe('440px');
    expect(expanded.transform).toBe('translateX(0)');
    expect(collapsed.transform).toBe('translateX(calc(-100% + 24px))');
    expect(collapsed.overflow).toBe('visible');
    expect(expanded.overflow).toBe('hidden');
  });

  it('bottomTab container spreads expected keys', () => {
    expect(sidebarStyles.bottomTab.container).toBeDefined();
    expect(sidebarStyles.bottomTab.list).toBeDefined();
    expect(sidebarStyles.bottomTab.trigger).toBeDefined();
  });
});
