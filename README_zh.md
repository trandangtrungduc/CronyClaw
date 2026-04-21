<h1 align="center">CronyClaw</h1>

<p align="center">
  <img src="resource/icon.png" width="360" alt="CronyClaw" />
</p>

<p align="center">
  <strong>一个 local-first 的 Agent Runtime：集成语音 + Skills + OpenClaw Bridge，并封装为现代桌面应用。</strong>
</p>

<p align="center">
  <a href="./README.md">English</a> · <a href="./README_vn.md">Tiếng Việt</a> · 中文
</p>

---

## 演示

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

该 monorepo 包含两个主要部分：

- `cronyclaw-backend`：Python 后端（`uv run run_server.py`）+ Docker Compose
- `cronyclaw-desktop`：Electron 桌面应用（React + TypeScript）

## 项目结构

- `cronyclaw-backend/` — 后端服务、API/WebSocket、Docker 配置
- `cronyclaw-desktop/` — 桌面客户端应用

## 快速开始

### 1) 运行 Backend

#### 方式 A — 使用 `uv` 本地运行

```bash
cd cronyclaw-backend
uv sync
uv run run_server.py
```

#### 方式 B — 使用 Docker Compose

```bash
cd cronyclaw-backend
docker compose up --build
```

后端地址：

- HTTP: `http://127.0.0.1:12393`
- WebSocket: `ws://127.0.0.1:12393/client-ws`

### 2) 运行 Desktop

```bash
cd cronyclaw-desktop
npm install
npm run dev
```

## 构建 Desktop

```bash
cd cronyclaw-desktop
npm run build:win
# 或：npm run build:mac
# 或：npm run build:linux
```

## OpenClaw 集成

CronyClaw 可通过 **两种** 方式接收 **OpenClaw** 侧更新：

1. **HTTP 技能（`claw-notify`）** — 添加代理技能（如 `claw-notify-skill`），让 OpenClaw 向 `http://127.0.0.1:12393/claw-notify` 发起 `POST`。同一台机器上最快上手；是否稳定取决于模型是否始终按技能执行。
2. **Gateway WebSocket 桥接** — 配置 `OPENCLAW_GATEWAY_URL` / `OPENCLAW_GATEWAY_TOKEN`（或 `conf.yaml`），由后端连接 OpenClaw 网关、完成基于 token 的 `connect`，首次配对可能需要 `openclaw devices approve <request_id>`。配置更重，更接近稳定事件流。

**详细说明**

- **后端** — 在后端 README 中查看 **将 CronyClaw 接入 OpenClaw**（架构、两种接入方式、`conf.yaml` / `conf.example.yaml`、环境变量、设备批准、缓存路径等）：[中文](./cronyclaw-backend/README_zh.md)、[English](./cronyclaw-backend/README.md)、[Tiếng Việt](./cronyclaw-backend/README_vn.md)。
- **桌面（前端）** — 在桌面 README 中查看 **在设置中连接 OpenClaw**（**Settings → General**、Base URL、桥接 URL/token、**Connect & Check Bridge**）：[中文](./cronyclaw-desktop/README_zh.md)、[English](./cronyclaw-desktop/README.md)、[Tiếng Việt](./cronyclaw-desktop/README_vn.md)。

## 致谢

CronyClaw 在 **[Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber)** 的基础上继承并继续开发。感谢该项目及其贡献者提供的基础工作。
