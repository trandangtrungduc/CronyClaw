# CronyClaw Desktop

[English](./README.md) | [Tiếng Việt](./README_vn.md) | 中文

一个使用 React 和 TypeScript 的 Electron 应用。

## 在设置中连接 OpenClaw

桌面端用于配置 CronyClaw **后端**上的 **OpenClaw 网关桥接**：把网关 WebSocket 地址和 token 交给服务器，并显示桥接是否已连接。这与 [后端 README](../cronyclaw-backend/README_zh.md) 中的「网关 WebSocket + token」路径一致。仅通过 HTTP 的 `claw-notify` 通知 **不会**使用这些输入项。

**前置条件**

- CronyClaw **后端**已启动且可访问（默认 **`http://127.0.0.1:12393`**）。
- 若使用桥接，OpenClaw **网关**已启动（常见 **`ws://127.0.0.1:18789`**）。

**操作步骤**

1. 在侧栏打开 **Settings（设置）**。
2. 进入 **General（通用）** 标签页。
3. 将 **Base URL** 设为后端 HTTP 根地址（例如 `http://127.0.0.1:12393`）。应用通过它调用 `POST /openclaw-bridge/config` 与 `GET /openclaw-bridge/status`。
4. **OpenClaw Bridge URL** 填网关的 WebSocket 地址（占位示例为 `ws://127.0.0.1:18789`）。
5. 若网关需要鉴权，填写 **OpenClaw Bridge Token**（与其他通用设置一样保存在本机）。
6. 点击 **Connect & Check Bridge（连接并检查桥接）**。界面会弹出提示；按钮下方显示已连接 / 未连接及错误与提示（例如需配对设备时，按提示执行 `openclaw devices approve <request_id>`）。
7. 设置窗口打开时会定期刷新状态。若失败，请核对 **Base URL**、后端日志，并查阅 [后端 README 中的 OpenClaw 说明](../cronyclaw-backend/README_zh.md)。

## 项目设置

### 安装

```bash
$ npm install
```

### 开发

```bash
$ npm run dev
```

### 构建

```bash
# Windows
$ npm run build:win

# macOS
$ npm run build:mac

# Linux
$ npm run build:linux
```
