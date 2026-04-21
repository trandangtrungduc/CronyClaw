import time
from typing import Any, Optional

from .config_types import OpenClawBridgeRuntime


def _extract_message_text(message: Any) -> str:
    if message is None:
        return ""
    if isinstance(message, str):
        return message.strip()
    if isinstance(message, dict):
        if isinstance(message.get("text"), str):
            t = message["text"].strip()
            if t:
                return t
        if "content" in message:
            return _extract_message_text(message.get("content"))
        for k in ("delta", "body", "value"):
            if k in message:
                return _extract_message_text(message.get(k))
        return ""
    if isinstance(message, list):
        parts = [_extract_message_text(x) for x in message]
        return " ".join(p for p in parts if p).strip()
    return str(message).strip()


class NotifyCooldown:
    def __init__(self, min_interval_ms: int) -> None:
        self._min_ms = max(0, min_interval_ms)
        self._last: dict[str, float] = {}

    def allow(self, key: str, now: Optional[float] = None) -> bool:
        if self._min_ms <= 0:
            return True
        t = now if now is not None else time.monotonic()
        if key not in self._last:
            self._last[key] = t
            return True
        prev = self._last[key]
        if (t - prev) * 1000 < self._min_ms:
            return False
        self._last[key] = t
        return True


def event_to_notification_text(
    event: str,
    payload: Any,
    runtime: OpenClawBridgeRuntime,
) -> Optional[str]:
    if not isinstance(payload, dict):
        payload = {}
    if event == "chat":
        if not runtime.notify_chat_final:
            return None
        state = payload.get("state")
        if state not in ("final", "error", "aborted"):
            return None
        if state == "error":
            err = payload.get("errorMessage")
            msg = _extract_message_text(payload.get("message"))
            part = err if isinstance(err, str) and err.strip() else msg
            return f"Chat error: {part}".strip() if part else "Chat error"
        if state == "aborted":
            msg = _extract_message_text(payload.get("message"))
            return msg if msg else "Chat aborted"
        return _extract_message_text(payload.get("message")) or None
    if event == "agent" and runtime.notify_agent:
        stream = payload.get("stream")
        data = payload.get("data")
        if isinstance(data, dict) and data:
            lines = [f"{k}: {v}" for k, v in data.items() if v is not None][:5]
            if lines:
                return f"Agent ({stream}): " + "; ".join(lines)
    return None


async def dispatch_gateway_event(
    event: str,
    payload: Any,
    runtime: OpenClawBridgeRuntime,
    cooldown: NotifyCooldown,
    get_handler,
) -> None:
    if event in ("heartbeat", "presence", "connect.challenge"):
        return
    text = event_to_notification_text(event, payload, runtime)
    if not text:
        return
    sk = "global"
    if isinstance(payload, dict):
        raw_sk = payload.get("sessionKey")
        if isinstance(raw_sk, str) and raw_sk.strip():
            sk = raw_sk.strip()
    if not cooldown.allow(sk):
        return
    handler = get_handler()
    if handler is None:
        return
    await handler.broadcast_external_notification(text, claw_name=runtime.claw_name)
