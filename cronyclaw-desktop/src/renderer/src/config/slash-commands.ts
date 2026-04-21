export type SlashCommand = {
  id: string
  label: string
  description: string
};

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'openclaw',
    label: 'OpenClaw CLI',
    description: 'Run OpenClaw CLI via companion (tool exec)',
  },
  {
    id: 'blender',
    label: 'Blender',
    description: 'Blender / MCP workflows (reserved)',
  },
];

export function findSlashCommandById(id: string): SlashCommand | undefined {
  return SLASH_COMMANDS.find((c) => c.id === id);
}
