# Crony Backend

English | [Tiếng Việt](./README_vn.md) | [中文](./README_zh.md)

Run the backend in two ways:

- Local runtime with `uv run run_server.py`
- Docker runtime with `docker compose up`

## Requirements

- Python 3.10-3.12
- `uv` package manager
- Docker Desktop (optional, only for Docker mode)
- Open a terminal in the project root directory

## Configuration (`conf.yaml`)

The backend loads **`conf.yaml`** from the **`cronyclaw-backend`** directory. The tracked template is **`conf.example.yaml`**; the app does not read that filename by itself.

**First-time setup**

1. `cd` into **`cronyclaw-backend`**.
2. Create your local config from the example:

   ```bash
   cp conf.example.yaml conf.yaml
   ```

   On Windows (PowerShell):

   ```powershell
   Copy-Item conf.example.yaml conf.yaml
   ```

3. Edit **`conf.yaml`**: replace placeholders (`YOUR_API_KEY`, `YOUR_API_BASE_URL`, `YOUR_MODEL_NAME`, `YOUR_OPENCLAW_GATEWAY_URL`, `YOUR_OPENCLAW_GATEWAY_TOKEN`, etc.) and paths so they match your machine and providers.

**What the file contains (overview)**

| Section | Purpose |
|--------|---------|
| **`system_config`** | `host`, `port`, `config_alts_dir`, tool prompt names, optional **`openclaw_bridge`** (`enabled`, `url`, `token`, `min_interval_ms`, …). Bridge URL/token can also come from **`OPENCLAW_GATEWAY_URL`** / **`OPENCLAW_GATEWAY_TOKEN`** when set. |
| **`character_config`** | Persona, **`agent_config`** (which agent, LLM choice), **`llm_configs`** (endpoints, keys, models), **`asr_config`**, **`tts_config`**, **`vad_config`**, preprocessor / translator options. |
| **`live_config`** | Optional live platform settings. |

**Git:** `conf.yaml` is ignored by `.gitignore` so secrets stay local. Commit changes to **`conf.example.yaml`** only when you intend to share non-secret defaults with others.

## Method 1: Run with `uv` (local environment)

```bash
uv sync
uv run run_server.py
```

Verbose logging:

```bash
uv run run_server.py --verbose
```

## Method 2: Run with Docker Compose

```bash
docker compose up --build
```

The backend will be available at:

- `http://127.0.0.1:12393`
- WebSocket: `ws://127.0.0.1:12393/client-ws`

Run in background:

```bash
docker compose up --build -d
```

View logs:

```bash
docker compose logs -f backend
```

Stop and remove containers:

```bash
docker compose down
```

Rebuild image:

```bash
docker compose build --no-cache backend
docker compose up -d
```

## Connecting CronyClaw to OpenClaw

There are **two** ways to bring OpenClaw activity into CronyClaw. They differ in setup, auth, and how reliable the feed is.

### Architecture

The **CronyClaw backend** is the single hub for notifications: it accepts input on **`POST /cronyclaw-notify`** and broadcasts to every client on **`WebSocket /client-ws`** (desktop, TTS, etc.) through one shared pipeline. OpenClaw never talks to the desktop directly; it either calls the HTTP endpoint or streams through the gateway that the backend connects to.

**Direction of the first hop**

- **Method 1:** OpenClaw (the agent, steered by a skill) **sends** HTTP **into** CronyClaw.
- **Method 2:** CronyClaw’s **OpenClaw bridge** **opens an outbound** WebSocket **to** the OpenClaw gateway, then consumes events.

Both paths merge **before** `/client-ws`, so the UI sees the same kind of updates.

| | **1. HTTP skill (`cronyclaw-notify`)** | **2. Gateway WebSocket bridge** |
|---|-----------------------------------|----------------------------------|
| **Idea** | OpenClaw’s agent calls CronyClaw’s HTTP API when it has something to say. | CronyClaw opens an outbound WebSocket to the OpenClaw **gateway** and listens for chat events. |
| **Setup** | Add an agent skill (like `cronyclaw-notify-skill`) that tells the model to `POST` to your local base URL. | Set gateway URL + token; first pairing may require approving a device in OpenClaw. |
| **Feel** | Easiest: no gateway token flow if you only use HTTP. | More setup: token, `connect` handshake with `openclaw devices approve <request_id>`. |
| **Trade-off** | Quick to try; quality depends on the agent always following the skill; same-machine URL must stay correct. | Closer to a stable, protocol-level stream; device token is cached after a successful connect. |

---

### Method 1 — Skill + local HTTP (easy path)

**Flow (renders as plain text in any Markdown viewer; monospace font recommended)**

```text
+-----------------------------+
| OpenClaw                    |
| Agent + notify skill        |
+--------------+--------------+
               |
               |  HTTP POST  (JSON: text, claw_name, …)
               v
+--------------+--------------+
| CronyClaw backend :12393   |
| POST /cronyclaw-notify          |
+--------------+--------------+
               |
               v
+--------------+--------------+
| Shared notify pipeline      |
| (same as manual cronyclaw-notify)|
+--------------+--------------+
               |
               v
+--------------+--------------+
| WebSocket /client-ws        |
| (broadcast to all clients)  |
+--------------+--------------+
               |
               v
+--------------+--------------+
| Desktop / TTS / clients     |
+-----------------------------+
```

1. Run the CronyClaw backend so it listens on your machine (default **`http://127.0.0.1:12393`**).
2. Register a **Cursor / OpenClaw agent skill** in the same spirit as `cronyclaw-notify-skill`: the skill should require the agent to notify the user by posting JSON to:

   `POST http://127.0.0.1:12393/cronyclaw-notify`  
   `Content-Type: application/json`  
   Body shape: `{"text":"...","claw_name":"OpenClaw"}` (see the skill template for the exact text format).

3. When OpenClaw runs steps, it issues those HTTP calls; CronyClaw treats them like other `cronyclaw-notify` traffic and forwards them to connected **`/client-ws`** clients (desktop, TTS, etc.).

**Why “easy but not always stable”:** nothing enforces the skill at the protocol layer. If the model skips a notify, the URL changes, or the backend is down, updates are missed. There is no WebSocket pairing—just reachable HTTP on localhost (or your chosen host).

---

### Method 2 — Gateway WebSocket + token (full bridge)

CronyClaw opens a **WebSocket client** to the OpenClaw **gateway**, completes a `connect` challenge with a **token**, then listens for high-level **`chat`** events (assistant `final` / `error` / `aborted`). Those are turned into the same notify path as Method 1, without the agent manually calling `curl`.

**Flow (plain text; no diagram engine required)**

```text
+-----------------------------+       +-----------------------------+
| CronyClaw backend           |  (1)  | OpenClaw Gateway            |
| openclaw bridge             | ----> | WebSocket server            |
| (opens outbound connection) |       | (e.g. ws://127.0.0.1:18789) |
+--------------+--------------+       +--------------+--------------+
               ^                                     |
               |                                     |
               +----------- (2) ---------------------+
               |   chat: final, error, aborted
               |
               v
+--------------+--------------+
| Shared notify pipeline      |
+--------------+--------------+
               |
               v
+--------------+--------------+
| WebSocket /client-ws        |
+--------------+--------------+
               |
               v
+--------------+--------------+
| Desktop / TTS / clients     |
+-----------------------------+

(1) Outbound WebSocket: connect handshake + token (device approve if needed)
(2) Gateway pushes high-level chat events; streaming deltas are not forwarded
```

1. **Start OpenClaw** with the gateway listening (many installs use something like **`ws://127.0.0.1:18789`**—use the URL your OpenClaw docs or UI show).
2. **Configure the bridge** (pick one):

   - **Environment (recommended):**  
     - `OPENCLAW_GATEWAY_URL` — must start with `ws://` or `wss://`.  
     - `OPENCLAW_GATEWAY_TOKEN` — token used in the gateway `connect` request when auth is required.  
   - **Or** `system_config.openclaw_bridge` in **`conf.yaml`** (see the commented example). If the URL is non-empty (from env or yaml), the bridge starts; if empty, it stays off.

3. **First-time / gated access:** if the gateway rejects `connect` and the error includes a **`requestId`** (or your OpenClaw CLI refers to a pending device), run the device approval flow your OpenClaw version documents, for example:

   `openclaw devices approve <request_id>`

   Use the **`request_id`** value from the gateway error or from OpenClaw’s device list (`openclaw devices list`) —wording may vary slightly by release.

4. **After a successful connect**, a **device token** can be stored under  
   `cronyclaw-backend/cache/openclaw_bridge_device_token.json`  
   and reused on restart (together with your configured gateway token as needed).

**Behavior notes:** streaming **`delta`** chunks are ignored so the UI is not flooded; tune **`min_interval_ms`** in yaml to throttle repeated `final` messages.

## Add a custom Live2D model

You can find free Live2D models on BOOTH:

- [BOOTH search: free live2d](https://booth.pm/en/search/free%20live2d)

After downloading a model, configure it in the backend with these steps:

1. Extract your model files into:

   `cronyclaw-backend/live2d-models/<your_model_name>/runtime/`

   Make sure this folder contains your main `.model3.json` file and its related textures/motions/expressions.

2. Add a new entry in `cronyclaw-backend/model_dict.json`.
   You can copy the existing `mao_pro` object and update these fields:
   - `name`: your model id (for example `my_model`)
   - `url`: path to your model json (for example `/live2d-models/my_model/runtime/my_model.model3.json`)
   - `kScale`, `initialXshift`, `initialYshift`, `kXOffset`: adjust model size/position for your screen
   - `emotionMap`: map tags like `joy`, `sadness`, `anger` to expression indexes your model supports
   - `idleMotionGroupName` and `tapMotions`: optional motion groups if your model has them

3. Update `cronyclaw-backend/conf.yaml`:
   - Set `character_config.live2d_model_name` to the same `name` you added in `model_dict.json`
   - Optionally set `character_config.avatar` to your character image filename

4. Restart the backend (`uv run run_server.py` or `docker compose up`) and reload your client UI.

If the model does not load, first check that:
- The file in `url` exists and is reachable from the backend root
- `live2d_model_name` exactly matches `model_dict.json` `name`
- Your model is Cubism 3/4 format with a valid `.model3.json`

## IndexTTS (local)

CronyClaw can drive **IndexTTS** over HTTP: it `POST`s JSON `{"text":"..."}` to your service and reads the response (see `src/cronyclaw/tts/index_tts.py`).

1. **Upstream setup** — Clone [index-tts/index-tts](https://github.com/index-tts/index-tts) and follow its **README** for Python, PyTorch/CUDA, checkpoints (`checkpoints/`), and any required example assets.

2. **API shim** — Use **`indextts_api_example.py`** in this repo as a starting point. Run it in the **same environment** where `from indextts.infer_v2 import IndexTTS2` works (typically the IndexTTS project root or a venv created from their instructions). Adjust `cfg_path`, `model_dir`, speaker/emotion audio paths, and `IndexTTS2(...)` flags to match your hardware and their layout.

3. **Run the service** — Example: `python indextts_api_example.py` → **`POST http://127.0.0.1:9880/tts`** with body `{"text":"..."}`.

4. **CronyClaw `conf.yaml`** — Set **`tts_config.tts_model`** to **`index_tts`** and **`tts_config.index_tts.api_url`** to the same base URL (e.g. `http://127.0.0.1:9880/tts`). Speaker/emotion files are applied **inside your API script** (as in the example); the backend’s HTTP call carries **text only**.

## Configuration Notes

- The `Dockerfile` updates `conf.yaml` so the backend binds to `0.0.0.0` inside the container.
- Default port mapping is `12393:12393` in `docker-compose.yml`.
- To change the host port, update the `ports` section in `docker-compose.yml`.
