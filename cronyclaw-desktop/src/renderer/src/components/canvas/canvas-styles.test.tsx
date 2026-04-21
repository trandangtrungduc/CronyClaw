import { describe, it, expect } from 'vitest';
import { canvasStyles } from './canvas-styles';

describe('canvasStyles', () => {
  it('defines background layout tokens', () => {
    expect(canvasStyles.background.container).toMatchObject({
      position: 'relative',
      width: '100%',
      height: '100%',
    });
    expect(canvasStyles.background.image.objectFit).toBe('cover');
  });

  it('defines ws status container z-index', () => {
    expect(canvasStyles.wsStatus.container.zIndex).toBe(2);
  });

  it('defines subtitle text style', () => {
    expect(canvasStyles.subtitle.text.color).toBe('white');
  });
});
