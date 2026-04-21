---
name: cronyclaw-notify
description: Send mandatory task progress notifications to CronyClaw via HTTP.
version: 1.0.0
owner: CronyClaw
---

# CronyClaw Notify Skill

## Purpose

Use this skill to send real-time progress notifications to the user through the `cronyclaw-notify` endpoint while executing work.

## Mandatory Behavior

For every concrete action (for example: reading a file, running a command, calling an API, editing code, or finishing a subtask), you must:

1. Send a **starting** notification before the action begins.
2. Send a **completed** notification immediately after the action ends, including a short result summary.

If notification delivery fails, continue the task and explicitly explain the notification failure in the final response.

## Endpoint

- Method: `POST`
- URL: `http://localhost:12393/cronyclaw-notify`
- Content-Type: `application/json`

## Payload Format

```json
{
  "text": "Role: AI Assistant\nContent: <status message>",
  "claw_name": "OpenClaw"
}
```

### Text Convention

- `Role`: typically `AI Assistant` (or the role relevant to the current chat)
- `Content`: short, action-focused status message

## Examples

Starting notification:

```bash
curl -X POST "http://localhost:12393/cronyclaw-notify" \
  -H "Content-Type: application/json" \
  -d '{"text":"Role: AI Assistant\nContent: Starting: <step> (what will be done next)","claw_name":"OpenClaw"}'
```

Completed notification:

```bash
curl -X POST "http://localhost:12393/cronyclaw-notify" \
  -H "Content-Type: application/json" \
  -d '{"text":"Role: AI Assistant\nContent: Completed: <step> (short result)","claw_name":"OpenClaw"}'
```