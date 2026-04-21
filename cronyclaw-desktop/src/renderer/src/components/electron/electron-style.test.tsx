import { describe, it, expect } from 'vitest';
import { inputSubtitleStyles } from './electron-style';

describe('inputSubtitleStyles', () => {
  it('exposes container and box layout tokens', () => {
    expect(inputSubtitleStyles.container).toMatchObject({
      position: 'absolute',
      zIndex: 1000,
    });
    expect(inputSubtitleStyles.box.w).toBe('400px');
  });

  it('draggableContainer toggles cursor and transition', () => {
    expect(inputSubtitleStyles.draggableContainer(false)).toMatchObject({
      cursor: 'grab',
    });
    expect(inputSubtitleStyles.draggableContainer(true)).toMatchObject({
      cursor: 'grabbing',
      transition: 'none',
    });
  });

  it('defines input and send control tokens', () => {
    expect(inputSubtitleStyles.input.size).toBe('sm');
    expect(inputSubtitleStyles.sendButton.color).toBe('whiteAlpha.800');
  });
});
