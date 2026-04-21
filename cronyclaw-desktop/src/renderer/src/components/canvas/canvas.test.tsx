import { describe, it, expect } from 'vitest';

describe('canvas module', () => {
  it('has no default export until implemented', async () => {
    const mod = await import('./canvas');
    expect(mod).toBeDefined();
    expect('default' in mod ? mod.default : undefined).toBeUndefined();
  });
});
