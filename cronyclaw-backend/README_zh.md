# Crony Backend

[English](./README.md) | [Tiếng Việt](./README_vn.md) | 中文

后端有两种运行方式：

- 本地使用 `uv run run_server.py`
- 使用 Docker 的 `docker compose up`

## 环境要求

- Python 3.10-3.12
- `uv` 包管理器
- Docker Desktop（可选，仅 Docker 模式需要）
- 在项目根目录打开终端

## 配置（`conf.yaml`）

后端从 **`cronyclaw-backend`** 目录读取 **`conf.yaml`**。仓库中的模板文件是 **`conf.example.yaml`**，程序不会自动使用该文件名。

**首次设置**

1. 进入 **`cronyclaw-backend`** 目录。
2. 从示例生成本地配置：

   ```bash
   cp conf.example.yaml conf.yaml
   ```

   Windows（PowerShell）：

   ```powershell
   Copy-Item conf.example.yaml conf.yaml
   ```

3. 编辑 **`conf.yaml`**：将占位符（如 `YOUR_API_KEY`、`YOUR_API_BASE_URL`、`YOUR_MODEL_NAME`、`YOUR_OPENCLAW_GATEWAY_URL`、`YOUR_OPENCLAW_GATEWAY_TOKEN` 等）及路径改为你的环境与服务商信息。

**文件结构概览**

| 区块 | 作用 |
|------|------|
| **`system_config`** | `host`、`port`、`config_alts_dir`、工具 prompt 名、可选 **`openclaw_bridge`**（`enabled`、`url`、`token`、`min_interval_ms` 等）。若设置了环境变量 **`OPENCLAW_GATEWAY_URL`** / **`OPENCLAW_GATEWAY_TOKEN`**，也可覆盖桥接配置。 |
| **`character_config`** | 人设、**`agent_config`**（代理与 LLM 选择）、**`llm_configs`**（接口、密钥、模型）、**`asr_config`**、**`tts_config`**、**`vad_config`** 等。 |
| **`live_config`** | 可选直播平台相关配置。 |

**Git：** `conf.yaml` 已在 `.gitignore` 中，避免提交密钥。仅在需要共享非敏感默认值时，再更新并提交 **`conf.example.yaml`**。

## 方式 1：使用 `uv`（本地环境）

```bash
uv sync
uv run run_server.py
```

详细日志模式：

```bash
uv run run_server.py --verbose
```

## 方式 2：使用 Docker Compose

```bash
docker compose up --build
```

后端地址：

- `http://127.0.0.1:12393`
- WebSocket: `ws://127.0.0.1:12393/client-ws`

## 后台运行

```bash
docker compose up --build -d
```

查看日志：

```bash
docker compose logs -f backend
```

停止并移除容器：

```bash
docker compose down
```

重建镜像：

```bash
docker compose build --no-cache backend
docker compose up -d
```

## 将 CronyClaw 接入 OpenClaw

共有 **两种**方式把 OpenClaw 侧的活动同步到 CronyClaw，配置难度、鉴权方式与通知稳定性不同。

### 架构说明

**CronyClaw 后端**是通知的汇聚点：在 **`POST /cronyclaw-notify`** 接收内容，经**同一条内部通路**推送给所有连接在 **`WebSocket /client-ws`** 上的客户端（桌面、TTS 等）。OpenClaw **不直连**桌面，只能通过「HTTP 打进后端」或「网关事件经桥接进入后端」两种方式接入。

**第一跳方向**

- **方式一：** OpenClaw 侧代理（由技能约束）通过 HTTP **主动请求** CronyClaw。
- **方式二：** CronyClaw 的 **openclaw 桥接**作为客户端，**向外**与 OpenClaw **网关**建立 WebSocket，再消费事件。

两条路径在到达 **`/client-ws`** 之前合并，因此界面侧感知的是同一类通知。

| | **1. HTTP 技能（`cronyclaw-notify`）** | **2. Gateway WebSocket 桥接** |
|---|-------------------------------------|-------------------------------|
| **思路** | OpenClaw 代理在需要通知时请求 CronyClaw 的 HTTP API。 | CronyClaw 作为客户端向 OpenClaw **网关**建立 WebSocket，监听聊天事件。 |
| **配置** | 添加类似 `cronyclaw-notify-skill` 的代理技能，指向本地 base URL。 | 配置网关 URL + token；首次可能需要在本机 OpenClaw 上批准设备。 |
| **难度** | 最简单：若只用 HTTP，可不走过网关 token 流程。 | 较难：token、`connect` 握手，有时需执行 `openclaw devices approve <request_id>`。 |
| **取舍** | 上手快；依赖模型是否始终遵守技能；本机 URL 需始终可达。 | 更接近协议级稳定流；连接成功后会缓存设备 token。 |

---

### 方式一 — 技能 + 本地 HTTP（简易路径）

**数据流**（纯文本，任意 Markdown 均可直接显示；建议等宽字体。）

```text
+-----------------------------+
| OpenClaw                    |
| Agent + notify skill        |
+--------------+--------------+
               |
               |  HTTP POST  (JSON: text, claw_name, …)
               v
+--------------+--------------+
| CronyClaw 后端 :12393       |
| POST /cronyclaw-notify           |
+--------------+--------------+
               |
               v
+--------------+--------------+
| 共享 notify 通路            |
|（与手动 cronyclaw-notify 相同）  |
+--------------+--------------+
               |
               v
+--------------+--------------+
| WebSocket /client-ws        |
|（向所有已连接客户端广播）    |
+--------------+--------------+
               |
               v
+--------------+--------------+
| 桌面 / TTS / 客户端         |
+-----------------------------+
```

1. 运行 CronyClaw 后端（默认 **`http://127.0.0.1:12393`**）。
2. 注册 **Cursor / OpenClaw 代理技能**，参考 `cronyclaw-notify-skill`：要求模型通过 JSON 请求通知：

   `POST http://127.0.0.1:12393/cronyclaw-notify`  
   `Content-Type: application/json`  
   请求体：`{"text":"...","claw_name":"OpenClaw"}`（正文格式以技能模板为准）。

3. OpenClaw 执行任务时发起上述 HTTP 请求；CronyClaw 与手动 `cronyclaw-notify` 走同一通路，并推送给已连接的 **`/client-ws`** 客户端（桌面、TTS 等）。

**为何「简单但未必稳定」：** 协议层不会强制发通知。若模型未按技能执行、URL 变更或后端未启动，更新会丢失。无需 WebSocket 配对，只要本机（或你指定的主机）上 HTTP 可达即可。

---

### 方式二 — 网关 WebSocket + token（完整桥接）

CronyClaw 向 OpenClaw **网关**建立 **WebSocket 客户端**，用 **token** 完成 `connect` 挑战，然后监听高层 **`chat`** 事件（助手 `final` / `error` / `aborted`），再映射到与方式一相同的通知路径，无需代理自行 `curl`。

**数据流**（纯文本，无需 Mermaid 等渲染器）

```text
+-----------------------------+       +-----------------------------+
| CronyClaw 后端              |  (1)  | OpenClaw Gateway            |
| openclaw bridge             | ----> | WebSocket 服务              |
|（主动向外建立连接）          |       |（如 ws://127.0.0.1:18789）   |
+--------------+--------------+       +--------------+--------------+
               ^                                     |
               |                                     |
               +----------- (2) ---------------------+
               |   chat: final, error, aborted
               |
               v
+--------------+--------------+
| 共享 notify 通路            |
+--------------+--------------+
               |
               v
+--------------+--------------+
| WebSocket /client-ws        |
+--------------+--------------+
               |
               v
+--------------+--------------+
| 桌面 / TTS / 客户端         |
+-----------------------------+

(1) 外向 WebSocket：connect 握手 + token（必要时设备批准）
(2) 网关下发高层 chat 事件；流式 delta 不会转给客户端
```

1. **启动 OpenClaw**，使网关处于监听（许多环境为 **`ws://127.0.0.1:18789`**，以你的安装文档或界面为准）。
2. **配置桥接**（任选其一）：

   - **环境变量（推荐）：**  
     - `OPENCLAW_GATEWAY_URL` — 必须以 `ws://` 或 `wss://` 开头。  
     - `OPENCLAW_GATEWAY_TOKEN` — 网关在需要鉴权时用于 `connect` 的 token。  
   - **或在 `conf.yaml` 中设置** `system_config.openclaw_bridge`（见文件内注释示例）。URL 非空（来自环境或 yaml）则启动桥接；为空则关闭。

3. **首次或被拦截：** 若网关拒绝 `connect` 且错误中含 **`requestId`**（或 OpenClaw CLI 提示有待批准设备），请按你所用 OpenClaw 版本的说明执行设备批准，例如：

   `openclaw devices approve <request_id>`

   使用网关错误或设备列表中的 **`request_id`**（`openclaw devices list`）；具体命令可能随版本略有差异。

4. **连接成功后**，**设备 token** 可能写入  
   `cronyclaw-backend/cache/openclaw_bridge_device_token.json`  
   供下次启动复用（仍可能需配合网关 token）。

**行为说明：** 流式 **`delta`** 会被忽略以免刷屏；可在 yaml 中调整 **`min_interval_ms`** 以限制连续多条 `final`。

## 添加自定义 Live2D 模型

你可以在 BOOTH 找到免费的 Live2D 模型：

- [BOOTH 搜索：free live2d](https://booth.pm/en/search/free%20live2d)

下载模型后，按以下步骤在后端中完成配置：

1. 将模型文件解压到：

   `cronyclaw-backend/live2d-models/<your_model_name>/runtime/`

   请确保该目录中包含主 `.model3.json` 文件，以及对应的贴图 / 动作 / 表情文件。

2. 在 `cronyclaw-backend/model_dict.json` 中新增一个条目。  
   可复制现有 `mao_pro` 对象并修改以下字段：
   - `name`：模型标识（例如 `my_model`）
   - `url`：模型 json 路径（例如 `/live2d-models/my_model/runtime/my_model.model3.json`）
   - `kScale`、`initialXshift`、`initialYshift`、`kXOffset`：用于调整模型大小与位置
   - `emotionMap`：将 `joy`、`sadness`、`anger` 等标签映射到模型支持的表情索引
   - `idleMotionGroupName` 与 `tapMotions`：如果模型带有动作组，可按需配置

3. 修改 `cronyclaw-backend/conf.yaml`：
   - 将 `character_config.live2d_model_name` 设为你在 `model_dict.json` 中填写的同一个 `name`
   - 可选：把 `character_config.avatar` 改成你的角色图片文件名

4. 重启后端（`uv run run_server.py` 或 `docker compose up`），并刷新客户端 UI。

若模型未加载，先检查：
- `url` 指向的文件是否存在，且路径相对于后端根目录可访问
- `live2d_model_name` 与 `model_dict.json` 里的 `name` 是否完全一致
- 模型是否为 Cubism 3/4，并且 `.model3.json` 有效

## IndexTTS（本地）

CronyClaw 通过 **HTTP** 调用 **IndexTTS**：`POST` JSON `{"text":"..."}` 并解析返回（见 `src/cronyclaw/tts/index_tts.py`）。

1. **按上游仓库搭建** — 克隆 [index-tts/index-tts](https://github.com/index-tts/index-tts)，并严格按其 **README** 配置 Python、PyTorch/CUDA、`checkpoints/` 及所需示例资源。

2. **API 封装** — 以本仓库中的 **`indextts_api_example.py`** 为模板，在 **`from indextts.infer_v2 import IndexTTS2` 能正常导入的环境** 中运行（一般为 IndexTTS 项目根目录或其文档要求的虚拟环境）。根据你的硬件与目录结构修改 `cfg_path`、`model_dir`、说话人/情感参考音频路径及 `IndexTTS2(...)` 参数。

3. **启动服务** — 例如：`python indextts_api_example.py` → 对 **`http://127.0.0.1:9880/tts`** 发送 **`POST`**，body 为 `{"text":"..."}`。

4. **CronyClaw `conf.yaml`** — 将 **`tts_config.tts_model`** 设为 **`index_tts`**，**`tts_config.index_tts.api_url`** 指向同一地址（如 `http://127.0.0.1:9880/tts`）。说话人/情感文件在 **API 脚本内** 指定（与示例一致）；后端 HTTP 请求 **仅携带文本**。

## 配置说明

- `Dockerfile` 会修改 `conf.yaml`，使后端在容器内监听 `0.0.0.0`。
- 默认端口映射为 `docker-compose.yml` 中的 `12393:12393`。
- 如需修改宿主机端口，请调整 `docker-compose.yml` 的 `ports` 配置。
