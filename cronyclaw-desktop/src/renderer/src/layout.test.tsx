import { describe, it, expect } from 'vitest';
import { layoutStyles } from './layout';

describe('layoutStyles', () => {
  it('exports expected base layout keys', () => {
    expect(layoutStyles).toBeTruthy();
    expect(layoutStyles.appContainer).toBeTruthy();
    expect(layoutStyles.sidebar).toBeTruthy();
    expect(layoutStyles.mainContent).toBeTruthy();
    expect(layoutStyles.footer).toBeTruthy();
  });

  it('sets app container offset for electron mode', () => {
    expect(layoutStyles.appContainer.mt).toBe('30px');
    expect(layoutStyles.appContainer.position).toBe('relative');
    expect(layoutStyles.sidebar.bg).toBe('gray.800');
  });

  it('computes canvasHeight based on footer collapsed state', () => {
    expect(layoutStyles.canvasHeight(false).height).toBe('calc(100% - 120px)');
    expect(layoutStyles.canvasHeight(true).height).toBe('calc(100% - 24px)');
  });
});
