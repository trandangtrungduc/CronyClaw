<h1 align="center">CronyClaw</h1>

<p align="center">
  <img src="resource/icon.png" width="360" alt="CronyClaw" />
</p>

<p align="center">
  <strong>Một runtime agent local-first với voice + Skills + cầu nối OpenClaw, đóng gói trong ứng dụng desktop hiện đại.</strong>
</p>

<p align="center">
  <a href="./README.md">English</a> · Tiếng Việt · <a href="./README_zh.md">中文</a>
</p>

---

## Demo

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

Monorepo gồm 2 phần chính:

- `cronyclaw-backend`: Python backend (`uv run run_server.py`) + Docker Compose
- `cronyclaw-desktop`: ứng dụng desktop Electron (React + TypeScript)

## Cấu trúc dự án

- `cronyclaw-backend/` — dịch vụ backend, API/WebSocket, cấu hình Docker
- `cronyclaw-desktop/` — ứng dụng desktop client

## Chạy nhanh

### 1) Chạy Backend

#### Cách A — Chạy local với `uv`

```bash
cd cronyclaw-backend
uv sync
uv run run_server.py
```

#### Cách B — Chạy với Docker Compose

```bash
cd cronyclaw-backend
docker compose up --build
```

Endpoint backend:

- HTTP: `http://127.0.0.1:12393`
- WebSocket: `ws://127.0.0.1:12393/client-ws`

### 2) Chạy Desktop

```bash
cd cronyclaw-desktop
npm install
npm run dev
```

## Build Desktop

```bash
cd cronyclaw-desktop
npm run build:win
# hoặc: npm run build:mac
# hoặc: npm run build:linux
```

## Tích hợp OpenClaw

CronyClaw nhận cập nhật từ **OpenClaw** theo **hai** hướng:

1. **Skill HTTP (`claw-notify`)** — Thêm agent skill (kiểu `claw-notify-skill`) để OpenClaw `POST` tới `http://127.0.0.1:12393/claw-notify`. Cài nhanh trên cùng máy; độ tin cậy phụ thuộc agent có tuân thủ skill.
2. **Cầu nối WebSocket gateway** — Cấu hình `OPENCLAW_GATEWAY_URL` / `OPENCLAW_GATEWAY_TOKEN` (hoặc `conf.yaml`) để backend nối tới gateway OpenClaw, bắt tay `connect` bằng token, có thể cần `openclaw devices approve <request_id>`. Cài phức tạp hơn, luồng sự kiện ổn định hơn.

**Hướng dẫn chi tiết**

- **Backend** — Trong README backend, mở mục **Kết nối CronyClaw với OpenClaw** (kiến trúc, hai cách tích hợp, `conf.yaml` / `conf.example.yaml`, biến môi trường, duyệt thiết bị, đường dẫn cache): [Tiếng Việt](./cronyclaw-backend/README_vn.md), [English](./cronyclaw-backend/README.md), [中文](./cronyclaw-backend/README_zh.md).
- **Desktop (frontend)** — Trong README desktop, mở **Kết nối OpenClaw (Cài đặt)** (**Settings → General**, Base URL, URL/token bridge, nút kết nối): [Tiếng Việt](./cronyclaw-desktop/README_vn.md), [English](./cronyclaw-desktop/README.md), [中文](./cronyclaw-desktop/README_zh.md).

## Lời cảm ơn

CronyClaw kế thừa và phát triển thêm dựa trên **[Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber)**. Xin cảm ơn dự án và các cộng tác viên đã tạo nền tảng.
