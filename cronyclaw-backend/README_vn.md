# Crony Backend

[English](./README.md) | Tiếng Việt | [中文](./README_zh.md)

Chạy backend theo 2 cách:

- Chạy local bằng `uv run run_server.py`
- Chạy bằng Docker với `docker compose up`

## Yêu cầu

- Python 3.10-3.12
- Trình quản lý gói `uv`
- Docker Desktop (tùy chọn, chỉ cần khi chạy Docker)
- Mở terminal tại thư mục gốc của project

## Cấu hình (`conf.yaml`)

Backend đọc **`conf.yaml`** trong thư mục **`cronyclaw-backend`**. File mẫu trong repo là **`conf.example.yaml`**; ứng dụng không tự đọc tên file đó.

**Lần đầu thiết lập**

1. `cd` vào **`cronyclaw-backend`**.
2. Sao chép file mẫu thành config đang dùng:

   ```bash
   cp conf.example.yaml conf.yaml
   ```

   Trên Windows (PowerShell):

   ```powershell
   Copy-Item conf.example.yaml conf.yaml
   ```

3. Sửa **`conf.yaml`**: thay các placeholder (`YOUR_API_KEY`, `YOUR_API_BASE_URL`, `YOUR_MODEL_NAME`, `YOUR_OPENCLAW_GATEWAY_URL`, `YOUR_OPENCLAW_GATEWAY_TOKEN`, …) và đường dẫn cho đúng máy và nhà cung cấp của bạn.

**Nội dung file (tóm tắt)**

| Mục | Vai trò |
|-----|---------|
| **`system_config`** | `host`, `port`, `config_alts_dir`, tên prompt công cụ, tùy chọn **`openclaw_bridge`** (`enabled`, `url`, `token`, `min_interval_ms`, …). URL/token cầu nối cũng có thể lấy từ **`OPENCLAW_GATEWAY_URL`** / **`OPENCLAW_GATEWAY_TOKEN`** nếu đã đặt. |
| **`character_config`** | Persona, **`agent_config`** (agent, LLM), **`llm_configs`** (endpoint, key, model), **`asr_config`**, **`tts_config`**, **`vad_config`**, v.v. |
| **`live_config`** | Tích hợp live tùy chọn. |

**Git:** `conf.yaml` nằm trong `.gitignore` để không commit bí mật. Chỉ commit thay đổi trên **`conf.example.yaml`** khi muốn chia sẻ giá trị mặc định không nhạy cảm.

## Cách 1: Chạy với `uv` (môi trường local)

```bash
uv sync
uv run run_server.py
```

Chạy verbose (log chi tiết):

```bash
uv run run_server.py --verbose
```

## Cách 2: Chạy với Docker Compose

```bash
docker compose up --build
```

Backend sẽ có tại:

- `http://127.0.0.1:12393`
- WebSocket: `ws://127.0.0.1:12393/client-ws`

Chạy nền:

```bash
docker compose up --build -d
```

Xem log:

```bash
docker compose logs -f backend
```

Dừng và dọn container:

```bash
docker compose down
```

Build lại image:

```bash
docker compose build --no-cache backend
docker compose up -d
```

## Kết nối CronyClaw với OpenClaw

Có **hai** cách đưa hoạt động OpenClaw vào CronyClaw. Khác nhau về cấu hình, xác thực và độ “ổn định” của luồng thông báo.

### Kiến trúc kết nối

**Backend CronyClaw** là điểm trung tâm cho mọi thông báo: nhận qua **`POST /cronyclaw-notify`**, xử lý trên **cùng một pipeline nội bộ**, rồi phát tới mọi client đang nối **`WebSocket /client-ws`** (desktop, TTS, …). OpenClaw **không** nói chuyện trực tiếp với desktop; chỉ có thể vào qua HTTP vào backend hoặc sự kiện gateway mà backend thu qua cầu nối.

**Chiều bước đầu tiên**

- **Cách 1:** Agent OpenClaw (bị skill bắt buộc) **chủ động gửi** HTTP **vào** CronyClaw.
- **Cách 2:** **Cầu nối openclaw** của CronyClaw **mở WebSocket đi ra** tới **gateway** OpenClaw rồi nhận sự kiện.

Hai đường **gộp trước** khi tới **`/client-ws`**, nên giao diện nhận cùng kiểu cập nhật.

| | **1. Skill HTTP (`cronyclaw-notify`)** | **2. Cầu nối WebSocket gateway** |
|---|-----------------------------------|----------------------------------|
| **Ý tưởng** | Agent OpenClaw gọi API HTTP của CronyClaw khi cần thông báo. | CronyClaw mở WebSocket **ra ngoài** tới **gateway** OpenClaw và lắng nghe sự kiện chat. |
| **Cài đặt** | Thêm agent skill (kiểu `cronyclaw-notify-skill`) trỏ tới base URL local. | Đặt URL gateway + token; lần đầu có thể phải duyệt thiết bị trên OpenClaw. |
| **Độ khó** | Dễ nhất: không cần luồng token gateway nếu chỉ dùng HTTP. | Khó hơn: token, bắt tay `connect`, đôi khi `openclaw devices approve <request_id>`. |
| **Đánh đổi** | Nhanh để thử; phụ thuộc agent có luôn làm theo skill; URL phải truy cập được. | Gần với luồng ổn định theo giao thức; token thiết bị được cache sau khi kết nối thành công. |

---

### Cách 1 — Skill + HTTP local (đường dễ)

**Luồng dữ liệu** (chữ thuần, mọi Markdown đều hiển thị; nên dùng font monospace.)

```text
+-----------------------------+
| OpenClaw                    |
| Agent + notify skill        |
+--------------+--------------+
               |
               |  HTTP POST  (JSON: text, claw_name, …)
               v
+--------------+--------------+
| CronyClaw backend :12393    |
| POST /cronyclaw-notify           |
+--------------+--------------+
               |
               v
+--------------+--------------+
| Shared notify pipeline      |
| (cùng đường cronyclaw-notify     |
|  thủ công)                  |
+--------------+--------------+
               |
               v
+--------------+--------------+
| WebSocket /client-ws        |
| (broadcast mọi client)      |
+--------------+--------------+
               |
               v
+--------------+--------------+
| Desktop / TTS / clients     |
+-----------------------------+
```

1. Chạy backend CronyClaw (mặc định **`http://127.0.0.1:12393`**).
2. Đăng ký **agent skill** (Cursor/OpenClaw) theo hướng dẫn như `cronyclaw-notify-skill`: bắt buộc agent gửi JSON tới:

   `POST http://127.0.0.1:12393/cronyclaw-notify`  
   `Content-Type: application/json`  
   Thân: `{"text":"...","claw_name":"OpenClaw"}` (định dạng chữ trong skill mẫu).

3. Khi OpenClaw chạy từng bước, các lệnh HTTP đó tới CronyClaw; backend xử lý giống `cronyclaw-notify` thủ công và đẩy tới client đang nối **`/client-ws`** (desktop, TTS, …).

**Vì sao “dễ nhưng không luôn ổn định”:** không có lớp giao thức bắt buộc gửi notify. Nếu model bỏ qua skill, đổi URL, hoặc backend tắt, bạn sẽ mất cập nhật. Không cần ghép WebSocket—chỉ cần HTTP tới localhost (hoặc host bạn chọn).

---

### Cách 2 — WebSocket gateway + token (cầu nối đầy đủ)

CronyClaw mở **WebSocket client** tới **gateway** OpenClaw, hoàn tất thử thách `connect` bằng **token**, rồi lắng nghe sự kiện **`chat`** cấp cao (`final` / `error` / `aborted`). Nội dung được đưa vào cùng đường thông báo như Cách 1, không cần agent tự gọi `curl`.

**Luồng dữ liệu** (chữ thuần, không cần Mermaid)

```text
+-----------------------------+       +-----------------------------+
| CronyClaw backend           |  (1)  | OpenClaw Gateway            |
| openclaw bridge             | ----> | WebSocket server            |
| (mở kết nối đi ra)          |       | (vd. ws://127.0.0.1:18789)  |
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

(1) WebSocket đi ra: bắt tay connect + token (có thể cần duyệt thiết bị)
(2) Gateway đẩy sự kiện chat cấp cao; delta stream không chuyển tới client
```

1. **Khởi động OpenClaw** với gateway đang lắng nghe (nhiều bản cài dùng dạng **`ws://127.0.0.1:18789`**—dùng đúng URL trong tài liệu/UI của bạn).
2. **Cấu hình cầu nối** (chọn một):

   - **Biến môi trường (khuyến nghị):**  
     - `OPENCLAW_GATEWAY_URL` — bắt đầu bằng `ws://` hoặc `wss://`.  
     - `OPENCLAW_GATEWAY_TOKEN` — token dùng trong yêu cầu `connect` khi gateway bật auth.  
   - **Hoặc** `system_config.openclaw_bridge` trong **`conf.yaml`** (xem ví dụ comment). URL khác rỗng (env hoặc yaml) thì bridge chạy; rỗng thì tắt.

3. **Lần đầu / bị chặn:** nếu gateway từ chối `connect` và lỗi có **`requestId`** (hoặc CLI OpenClaw nói thiết bị chờ duyệt), chạy bước duyệt thiết bị theo tài liệu phiên bản OpenClaw của bạn, ví dụ:

   `openclaw devices approve <request_id>`

   Dùng đúng **`request_id`** từ thông báo lỗi gateway hoặc danh sách thiết bị (`openclaw devices list`) — cú pháp có thể khác nhẹ theo bản phát hành.

4. **Sau khi `connect` thành công**, **device token** có thể được lưu tại  
   `cronyclaw-backend/cache/openclaw_bridge_device_token.json`  
   để dùng lại khi khởi động (kèm token gateway nếu vẫn cần).

**Ghi chú hành vi:** luồng **`delta`** bị bỏ qua để không spam giao diện; chỉnh **`min_interval_ms`** trong yaml để giới hạn nhiều `final` liên tiếp.

## Thêm model Live2D tùy chỉnh

Bạn có thể tìm model Live2D miễn phí trên BOOTH:

- [BOOTH search: free live2d](https://booth.pm/en/search/free%20live2d)

Sau khi tải model, cấu hình vào backend theo các bước sau:

1. Giải nén model vào:

   `cronyclaw-backend/live2d-models/<your_model_name>/runtime/`

   Đảm bảo thư mục này có file `.model3.json` chính cùng các file texture/motion/expression liên quan.

2. Thêm một entry mới trong `cronyclaw-backend/model_dict.json`.  
   Bạn có thể copy object `mao_pro` sẵn có rồi chỉnh các trường:
   - `name`: id model (ví dụ `my_model`)
   - `url`: đường dẫn tới model json (ví dụ `/live2d-models/my_model/runtime/my_model.model3.json`)
   - `kScale`, `initialXshift`, `initialYshift`, `kXOffset`: chỉnh kích thước/vị trí model
   - `emotionMap`: map các tag như `joy`, `sadness`, `anger` sang index expression model hỗ trợ
   - `idleMotionGroupName` và `tapMotions`: cấu hình nhóm motion nếu model có

3. Cập nhật `cronyclaw-backend/conf.yaml`:
   - Đặt `character_config.live2d_model_name` giống đúng `name` vừa thêm trong `model_dict.json`
   - Tùy chọn: đổi `character_config.avatar` sang tên file ảnh nhân vật của bạn

4. Khởi động lại backend (`uv run run_server.py` hoặc `docker compose up`) và reload UI client.

Nếu model không lên, kiểm tra trước:
- File trong `url` có tồn tại và truy cập được từ root backend
- `live2d_model_name` có khớp chính xác với `name` trong `model_dict.json`
- Model ở định dạng Cubism 3/4 và `.model3.json` hợp lệ

## IndexTTS (chạy cục bộ)

CronyClaw gọi **IndexTTS** qua HTTP: gửi `POST` JSON `{"text":"..."}` và xử lý phản hồi (xem `src/cronyclaw/tts/index_tts.py`).

1. **Cài đặt theo upstream** — Clone [index-tts/index-tts](https://github.com/index-tts/index-tts) và làm theo **README** gốc về Python, PyTorch/CUDA, checkpoint (`checkpoints/`) và tài nguyên mẫu họ yêu cầu.

2. **Lớp API** — Dùng **`indextts_api_example.py`** trong repo này làm mẫu. Chạy trong **cùng môi trường** mà `from indextts.infer_v2 import IndexTTS2` import được (thường là thư mục gốc dự án IndexTTS hoặc venv theo hướng dẫn của họ). Chỉnh `cfg_path`, `model_dir`, đường dẫn audio speaker/cảm xúc và tham số `IndexTTS2(...)` cho khớp phần cứng và cấu trúc repo của bạn.

3. **Chạy dịch vụ** — Ví dụ: `python indextts_api_example.py` → **`POST http://127.0.0.1:9880/tts`** với body `{"text":"..."}`.

4. **`conf.yaml` của CronyClaw** — Đặt **`tts_config.tts_model`** thành **`index_tts`** và **`tts_config.index_tts.api_url`** trùng URL dịch vụ (ví dụ `http://127.0.0.1:9880/tts`). File speaker/cảm xúc được cấu hình **trong script API** (như ví dụ); backend chỉ gửi **nội dung text** qua HTTP.

## Lưu ý cấu hình

- Dockerfile đã chỉnh `conf.yaml` để backend bind `0.0.0.0` trong container.
- Port map mặc định là `12393:12393` trong `docker-compose.yml`.
- Khi cần đổi port host, sửa phần `ports` trong `docker-compose.yml`.