import { describe, it, expect } from 'vitest';
import { footerStyles } from './footer-styles';

describe('footerStyles', () => {
  it('container uses transparent background when collapsed', () => {
    expect(footerStyles.footer.container(true).bg).toBe('transparent');
    expect(footerStyles.footer.container(true).overflow).toBe('visible');
  });

  it('container uses solid background when expanded', () => {
    expect(footerStyles.footer.container(false).bg).toBe('gray.800');
    expect(footerStyles.footer.container(false).overflow).toBe('hidden');
  });

  it('defines ai indicator sizing', () => {
    expect(footerStyles.aiIndicator.container.width).toBe('110px');
    expect(footerStyles.aiIndicator.text.fontSize).toBe('12px');
  });
});
