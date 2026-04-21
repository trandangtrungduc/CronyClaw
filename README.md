<h1 align="center">CronyClaw</h1>

<p align="center">
  <img src="resource/icon.png" width="360" alt="CronyClaw" />
</p>

<p align="center">
  <strong>A local-first agent runtime with voice + Skills + OpenClaw bridge, packaged as a modern desktop app.</strong>
</p>

<p align="center">
  English · <a href="./README_vn.md">Tiếng Việt</a> · <a href="./README_zh.md">中文</a>
</p>

---

## Demos

<table>
  <tr>
    <td align="center">
      <h3>Demo 1</h3>
      <video controls width="480" src="https://github.com/user-attachments/assets/a1e2cbf4-dfc9-4deb-b01a-6e558d252711"></video>
    </td>
    <td align="center">
      <h3>Demo 2</h3>
      <video controls width="480" src="https://github.com/user-attachments/assets/35acffaa-7bb1-4939-b8b9-7c57efe4ad63"></video>
    </td>
  </tr>
</table>

---

This monorepo contains two main components:

- `cronyclaw-backend`: Python backend (`uv run run_server.py`) + Docker Compose
- `cronyclaw-desktop`: Electron desktop app (React + TypeScript)

## Project Structure

- `cronyclaw-backend/` — backend service, API/WebSocket, Docker setup
- `cronyclaw-desktop/` — desktop client app

## Quick Start

### 1) Run Backend

#### Option A — Local with `uv`

```bash
cd cronyclaw-backend
uv sync
uv run run_server.py
```

#### Option B — Docker Compose

```bash
cd cronyclaw-backend
docker compose up --build
```

Backend endpoints:

- HTTP: `http://127.0.0.1:12393`
- WebSocket: `ws://127.0.0.1:12393/client-ws`

### 2) Run Desktop

```bash
cd cronyclaw-desktop
npm install
npm run dev
```

## Build Desktop

```bash
cd cronyclaw-desktop
npm run build:win
# or: npm run build:mac
# or: npm run build:linux
```

## OpenClaw Integration

CronyClaw can receive updates from **OpenClaw** in **two** ways:

1. **HTTP skill (`claw-notify`)** — Add an agent skill (like `claw-notify-skill`) so OpenClaw posts to `http://127.0.0.1:12393/claw-notify`. Fast to set up on one machine; behavior depends on the agent following the skill.
2. **Gateway WebSocket bridge** — Configure `OPENCLAW_GATEWAY_URL` / `OPENCLAW_GATEWAY_TOKEN` (or `conf.yaml`) so the backend connects to the OpenClaw gateway, completes token-based `connect`, and may require `openclaw devices approve <request_id>` for pairing. More setup, closer to a stable event stream.

**Detailed guidelines**

- **Backend** — In the backend README, open the section **Connecting CronyClaw to OpenClaw** for architecture, both integration paths, `conf.yaml` / `conf.example.yaml`, env vars, device approval, and cache paths: [English](./cronyclaw-backend/README.md), [Vietnamese](./cronyclaw-backend/README_vn.md), [Chinese](./cronyclaw-backend/README_zh.md).
- **Desktop (frontend)** — In the desktop README, open **Connecting OpenClaw (Settings)** for **Settings → General**, Base URL, OpenClaw bridge URL/token, and **Connect & Check Bridge**: [English](./cronyclaw-desktop/README.md), [Vietnamese](./cronyclaw-desktop/README_vn.md), [Chinese](./cronyclaw-desktop/README_zh.md).

## Acknowledgements

CronyClaw is built by inheriting from and extending **[Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber)**. Thanks to that project and its contributors for the foundation.
