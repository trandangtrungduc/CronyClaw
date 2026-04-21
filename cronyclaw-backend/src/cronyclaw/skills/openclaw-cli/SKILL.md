# SKILL: openclaw-cli

## Goal

This skill teaches the companion how to interpret user intent and execute `openclaw` CLI commands correctly on local machine via MCP `exec`.

Use this skill to avoid these common failures:

- vague intent not mapped to the right subcommand
- malformed quotes in `--message`
- wrong flags for `agent`/`gateway`/`channels` workflows
- pretending command was executed when no tool call happened

## Read this skill when

- user asks to run any `openclaw ...` command
- user asks what command should be used
- user asks troubleshooting around OpenClaw CLI/Gateway/channels
- user gives natural language task that should become an `openclaw` command

## High-level execution flow

1. Detect intent and map to one subcommand family.
2. Build exact command string with safe quoting.
3. If user asked execution, run through MCP `exec` with `shell="bash"`.
4. Report output faithfully (no fabricated success).
5. If command fails, give direct fix and next command.

If user asks explanation only, do not execute.

## Shell and execution policy

- Preferred shell for this project: `bash`
- Use MCP payload shape:

```json
{"command":"openclaw ...","shell":"bash"}
```

- Do not chain unrelated commands.
- Do not add destructive extras unless user explicitly asked.

## Quoting policy (critical)

- Wrap natural language values in double quotes.
- Escape embedded double quotes as `\"`.
- Preserve user text in `--message` unless user requests rewrite.

Example:

```bash
openclaw agent --agent main --message "help me write a cute email to my wife for congratulating her graduation master"
```

## Intent -> command mapping

### A) `openclaw agent` (single turn via gateway)

Use when user wants to send one message/task to an agent.

Typical forms:

```bash
openclaw agent --agent <id> --message "<text>"
openclaw agent --to <channel-target> --message "<text>" --deliver
openclaw agent --session-id <id> --message "<text>" --thinking medium
```

Good examples:

```bash
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent main --message "Write a concise release note"
openclaw agent --to +15555550123 --message "status update" --deliver
```

Checklist before run:

- Has target? (`--agent` or valid alternative target mode)
- Has `--message`?
- If delivery requested: include `--deliver`

### B) `openclaw agents` (agent management)

Use when user manages agent definitions/routing/identity.

Examples:

```bash
openclaw agents list
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

### C) `openclaw channels` (accounts + runtime + probe)

Use for channel account config and status.

Examples:

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels add --channel telegram --token <bot-token>
openclaw channels remove --channel telegram --delete
openclaw channels logs --channel all
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

### D) `openclaw doctor` (diagnose + repair)

Use for health checks and guided fixes.

Examples:

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
```

Notes:

- `--fix` is alias of repair path in docs context.
- prefer non-interactive-safe behavior when no TTY.

### E) `openclaw gateway` (run/query/discover/manage service)

Use for gateway lifecycle and probing.

Run:

```bash
openclaw gateway
openclaw gateway run
```

Status/probe/call:

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway status
openclaw gateway status --json
openclaw gateway probe
openclaw gateway call status
```

Service lifecycle:

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Discovery:

```bash
openclaw gateway discover
openclaw gateway discover --json
```

### F) `openclaw health` (quick gateway health)

Examples:

```bash
openclaw health
openclaw health --json
openclaw health --verbose
```

### G) `openclaw skills` (skill operations)

Examples:

```bash
openclaw skills search "calendar"
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills info <name>
openclaw skills check
```

## Clarification rules

Ask a concise follow-up when key inputs are missing:

- agent id missing for `openclaw agent`
- message missing for `openclaw agent`
- channel missing for `channels add/remove/login/logout`
- unclear whether user wants run vs just show command

Only one short clarification at a time.

## Error handling playbook

If command fails, return:

1. exact failing command
2. key stderr line(s)
3. one direct next-step fix command

Common fixes:

- `command not found: openclaw`
  - check install and PATH
  - try full binary path
- auth/connectivity failures
  - suggest `openclaw health --json`
  - suggest `openclaw gateway status --json`
- channel issues
  - suggest `openclaw channels status`
  - suggest `openclaw doctor --repair`

## Never do

- never claim execution if MCP tool call did not occur
- never silently rewrite semantics of user message
- never hide stderr when command fails
- never run unrelated extra commands without user intent

## Ready-to-use templates

### Template: natural language -> `openclaw agent`

User intent:
- "send this task to main agent: summarize my inbox"

Command:

```bash
openclaw agent --agent main --message "summarize my inbox"
```

MCP payload:

```json
{"command":"openclaw agent --agent main --message \"summarize my inbox\"","shell":"bash"}
```

### Template: health-first troubleshooting

```bash
openclaw health --json
openclaw gateway status --json
openclaw doctor --repair
```
