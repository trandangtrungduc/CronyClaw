# CronyClaw Desktop

[English](./README.md) | Tiếng Việt | [中文](./README_zh.md)

Ứng dụng Electron sử dụng React và TypeScript.

## Kết nối OpenClaw (Cài đặt)

Ứng dụng desktop điều khiển **cầu nối gateway OpenClaw** trên backend CronyClaw: gửi URL và token gateway tới server và hiển thị trạng thái kết nối. Đây là cùng luồng WebSocket + token trong [README backend](../cronyclaw-backend/README_vn.md). Thông báo chỉ qua HTTP (`claw-notify`) **không** dùng các ô này.

**Điều kiện**

- **Backend** CronyClaw đang chạy và truy cập được (mặc định **`http://127.0.0.1:12393`**).
- **Gateway** OpenClaw đang chạy nếu bật cầu nối (thường **`ws://127.0.0.1:18789`**).

**Các bước**

1. Mở **Settings** trên thanh bên.
2. Vào tab **General**.
3. Đặt **Base URL** tới gốc HTTP của backend (vd. `http://127.0.0.1:12393`). App dùng URL này cho `POST /openclaw-bridge/config` và `GET /openclaw-bridge/status`.
4. Đặt **OpenClaw Bridge URL** tới WebSocket gateway (gợi ý mặc định `ws://127.0.0.1:18789`).
5. Điền **OpenClaw Bridge Token** nếu gateway yêu cầu (lưu cục bộ như các mục General khác).
6. Bấm **Kết nối và kiểm tra Bridge** (Connect & Check Bridge). Toast báo thành bại; dưới nút có trạng thái **đã kết nối** / **chưa kết nối** và gợi ý lỗi (vd. ghép thiết bị: chạy `openclaw devices approve <request_id>` khi gợi ý hiển thị).
7. Trạng thái được hỏi lại định kỳ khi Settings mở. Nếu lỗi, kiểm tra **Base URL**, log backend và [phần OpenClaw trong README backend](../cronyclaw-backend/README_vn.md).

## Thiết lập dự án

### Cài đặt

```bash
$ npm install
```

### Phát triển

```bash
$ npm run dev
```

### Build

```bash
# Dành cho Windows
$ npm run build:win

# Dành cho macOS
$ npm run build:mac

# Dành cho Linux
$ npm run build:linux
```
