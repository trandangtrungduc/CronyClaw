import asyncio
import json
import sys
from dataclasses import replace
from pathlib import Path
from urllib.parse import urlparse
from typing import Any, Callable

import websockets
from loguru import logger

from .notify import NotifyCooldown, dispatch_gateway_event
from .protocol import (
    build_connect_params,
    dumps_req,
    load_or_create_device_identity,
)
from .config_types import OpenClawBridgeRuntime


def _resolve_origin(ws_url: str) -> str | None:
    parsed = urlparse(ws_url)
    if parsed.scheme == "ws":
        return f"http://{parsed.netloc}"
    if parsed.scheme == "wss":
        return f"https://{parsed.netloc}"
    return None


def _load_cached_device_token(path: Path, device_id: str) -> str:
    if not path.exists():
        return ""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return ""
    if not isinstance(data, dict):
        return ""
    if data.get("device_id") != device_id:
        return ""
    token = data.get("device_token")
    if isinstance(token, str):
        return token.strip()
    return ""


def _store_cached_device_token(path: Path, device_id: str, token: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"device_id": device_id, "device_token": token.strip()}
    path.write_text(json.dumps(payload), encoding="utf-8")


def _parse_connect_nonce(msg: dict[str, Any]) -> str:
    payload = msg.get("payload")
    if not isinstance(payload, dict):
        return ""
    raw_nonce = payload.get("nonce")
    if not isinstance(raw_nonce, str):
        return ""
    return raw_nonce.strip()


def _extract_connect_error(msg: dict[str, Any]) -> RuntimeError:
    err = msg.get("error") or {}
    if not isinstance(err, dict):
        return RuntimeError("gateway_error: request failed")
    code = err.get("code", "gateway_error")
    text = err.get("message", "request failed")
    details = err.get("details")
    detail_code = ""
    request_id = ""
    if isinstance(details, dict):
        raw_detail_code = details.get("code")
        raw_request_id = details.get("requestId")
        if isinstance(raw_detail_code, str):
            detail_code = raw_detail_code
        if isinstance(raw_request_id, str):
            request_id = raw_request_id
    suffix = ""
    if detail_code:
        suffix += f" details.code={detail_code}"
    if request_id:
        suffix += f" requestId={request_id}"
    return RuntimeError(f"{code}: {text}{suffix}")


class OpenClawBridgeRunner:
    def __init__(
        self,
        runtime: OpenClawBridgeRuntime,
        get_websocket_handler: Callable[[], Any],
    ) -> None:
        self._runtime = runtime
        self._get_handler = get_websocket_handler
        self._stop = asyncio.Event()
        self._cooldown = NotifyCooldown(runtime.min_interval_ms)
        self._connected = False
        self._last_error = ""
        self._active_ws: Any = None
        self._device_identity: dict[str, Any] | None = None
        self._token_path: Path | None = None
        self._connect_token = runtime.token

    def stop(self) -> None:
        self._stop.set()

    def get_status(self) -> dict[str, Any]:
        return {
            "connected": self._connected,
            "last_error": self._last_error,
            "device_id": (self._device_identity or {}).get("device_id"),
            "url": self._runtime.url,
            "client_id": self._runtime.client_id,
            "client_version": self._runtime.client_version,
        }

    async def apply_runtime_settings(self, *, url: str, token: str) -> dict[str, Any]:
        self._runtime = replace(self._runtime, url=url, token=token)
        self._connect_token = token
        if self._active_ws is not None:
            try:
                await self._active_ws.close(code=1012, reason="bridge settings updated")
            except Exception:
                pass
        return self.get_status()

    async def _send_connect(
        self,
        ws: Any,
        nonce: str,
        connect_token: str,
        device_identity: dict[str, Any],
    ) -> str:
        params = build_connect_params(
            client_id=self._runtime.client_id,
            client_version=self._runtime.client_version,
            platform=sys.platform,
            token=connect_token,
            password=self._runtime.password,
            nonce=nonce,
            device_identity=device_identity,
        )
        req_id, req_raw = dumps_req("connect", params)
        await ws.send(req_raw)
        return req_id

    async def run_forever(self) -> None:
        backoff = 1.0
        max_backoff = 60.0
        project_root = Path(__file__).resolve().parents[3]
        key_path = project_root / "cache" / "openclaw_bridge_device.key"
        token_path = project_root / "cache" / "openclaw_bridge_device_token.json"
        device_identity = load_or_create_device_identity(str(key_path))
        self._device_identity = device_identity
        self._token_path = token_path
        logger.info(
            "OpenClaw bridge device identity loaded: {} ({})",
            device_identity["device_id"],
            device_identity["key_path"],
        )
        cached_token = _load_cached_device_token(token_path, device_identity["device_id"])
        self._connect_token = cached_token or self._runtime.token
        if cached_token:
            logger.info("OpenClaw bridge using cached device token ({})", token_path)
        while not self._stop.is_set():
            try:
                origin = _resolve_origin(self._runtime.url)
                async with websockets.connect(
                    self._runtime.url,
                    origin=origin,
                    ping_interval=20,
                    ping_timeout=20,
                ) as ws:
                    self._active_ws = ws
                    req_id: str | None = None
                    connected = False
                    async for raw in ws:
                        if self._stop.is_set():
                            break
                        try:
                            msg = json.loads(raw)
                        except json.JSONDecodeError:
                            continue
                        mtype = msg.get("type")
                        if mtype == "event":
                            ev = msg.get("event")
                            if ev == "connect.challenge":
                                nonce = _parse_connect_nonce(msg)
                                if not nonce:
                                    raise RuntimeError("connect.challenge missing nonce")
                                req_id = await self._send_connect(
                                    ws,
                                    nonce,
                                    self._connect_token,
                                    device_identity,
                                )
                                continue
                            if not connected:
                                continue
                            if not isinstance(ev, str):
                                continue
                            pl = msg.get("payload")
                            try:
                                await dispatch_gateway_event(
                                    ev,
                                    pl,
                                    self._runtime,
                                    self._cooldown,
                                    self._get_handler,
                                )
                            except Exception as ex:
                                logger.error(f"OpenClaw bridge notify error: {ex}")
                            continue
                        if mtype == "res":
                            rid = msg.get("id")
                            if not isinstance(rid, str) or rid != req_id:
                                continue
                            if msg.get("ok"):
                                payload = msg.get("payload")
                                if isinstance(payload, dict):
                                    auth = payload.get("auth")
                                    if isinstance(auth, dict):
                                        device_token = auth.get("deviceToken")
                                        if isinstance(device_token, str) and device_token.strip():
                                            _store_cached_device_token(
                                                token_path,
                                                device_identity["device_id"],
                                                device_token,
                                            )
                                            self._connect_token = device_token.strip()
                                connected = True
                                self._connected = True
                                self._last_error = ""
                                backoff = 1.0
                                logger.info("OpenClaw bridge connected")
                                continue
                            raise _extract_connect_error(msg)
            except asyncio.CancelledError:
                raise
            except Exception as e:
                self._connected = False
                self._last_error = f"{type(e).__name__}: {e!r}"
                if self._stop.is_set():
                    break
                logger.warning(
                    "OpenClaw bridge disconnected: {} {!r}, retry in {:.1f}s",
                    type(e).__name__,
                    e,
                    backoff,
                )
                try:
                    await asyncio.wait_for(self._stop.wait(), timeout=backoff)
                    break
                except asyncio.TimeoutError:
                    pass
                backoff = min(max_backoff, backoff * 2)
            finally:
                self._active_ws = None
