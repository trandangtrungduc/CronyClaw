# CronyClaw Desktop

English | [Tiếng Việt](./README_vn.md) | [中文](./README_zh.md)

An Electron application with React and TypeScript

## Connecting OpenClaw (Settings)

The desktop app can drive the **OpenClaw gateway bridge** on the CronyClaw backend: it sends your gateway URL and token to the server and shows whether the bridge is connected. This is the same bridge described in the [backend README](../cronyclaw-backend/README.md) (WebSocket + token path). HTTP-only notify via `claw-notify` does not use these fields.

**Prerequisites**

- CronyClaw **backend** is running and reachable (default **`http://127.0.0.1:12393`**).
- OpenClaw **gateway** is running if you use the bridge (often **`ws://127.0.0.1:18789`**).

**Steps**

1. Open **Settings** in the app sidebar.
2. Open the **General** tab.
3. Set **Base URL** to your backend HTTP root (e.g. `http://127.0.0.1:12393`). The app uses this to call `POST /openclaw-bridge/config` and `GET /openclaw-bridge/status`.
4. Set **OpenClaw Bridge URL** to the gateway WebSocket URL (placeholder suggests `ws://127.0.0.1:18789`).
5. Set **OpenClaw Bridge Token** if your gateway requires a token (stored locally like other general settings).
6. Click **Connect & Check Bridge**. A toast reports success or failure; below the button, status shows **connected** (green) or **not connected** (orange), with error text and hints when the backend returns them (e.g. device pairing: run `openclaw devices approve <request_id>` when the hint says so).
7. Status is polled periodically while Settings stay open. If something fails, confirm **Base URL**, backend logs, and the [backend OpenClaw section](../cronyclaw-backend/README.md).

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
