import { describe, it, expect } from 'vitest';

describe("i18n", () => {
  it('loads and exposes public exports', async () => {
    const mod = await import("./i18n");
    const keys = Object.keys(mod as Record<string, unknown>);
    expect(keys.length).toBeGreaterThan(0);
  });
});
