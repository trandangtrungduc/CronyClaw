import { describe, it, expect } from 'vitest';
import { settingStyles } from './setting-styles';

describe('settingStyles', () => {
  it('settingUI container fills panel', () => {
    expect(settingStyles.settingUI.container.width).toBe('100%');
    expect(settingStyles.settingUI.container.height).toBe('100%');
  });

  it('tab root defines width', () => {
    expect(settingStyles.settingUI.tabs.root.width).toBe('100%');
  });
});
