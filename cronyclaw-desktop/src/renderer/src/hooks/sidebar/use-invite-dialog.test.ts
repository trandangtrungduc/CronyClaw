import { describe, it, expect } from 'vitest';

describe('useInviteDialog', () => {
  it('currently exports nothing', async () => {
    const mod = await import('./use-invite-dialog');
    expect(Object.keys(mod as Record<string, unknown>)).toEqual([]);
  });
});
