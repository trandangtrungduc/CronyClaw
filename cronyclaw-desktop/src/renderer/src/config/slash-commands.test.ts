import { describe, it, expect } from 'vitest';
import {
  SLASH_COMMANDS,
  findSlashCommandById,
} from './slash-commands';

describe('slash-commands', () => {
  it('exposes known commands', () => {
    expect(SLASH_COMMANDS.length).toBeGreaterThan(0);
    expect(SLASH_COMMANDS.every((c) => c.id && c.label)).toBe(true);
  });

  it('findSlashCommandById returns a match', () => {
    expect(findSlashCommandById('openclaw')?.id).toBe('openclaw');
  });

  it('findSlashCommandById returns undefined for unknown id', () => {
    expect(findSlashCommandById('nope')).toBeUndefined();
  });
});
