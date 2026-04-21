from typing import ClassVar, Dict
from pydantic import Field

from .i18n import I18nMixin, Description


class OpenClawBridgeSettings(I18nMixin):
    enabled: bool = Field(default=True, alias="enabled")
    url: str = Field(default="", alias="url")
    token: str = Field(default="", alias="token")
    password: str = Field(default="", alias="password")
    claw_name: str = Field(default="OpenClaw", alias="claw_name")
    min_interval_ms: int = Field(default=2000, alias="min_interval_ms", ge=0)
    notify_chat_final: bool = Field(default=True, alias="notify_chat_final")
    notify_agent: bool = Field(default=False, alias="notify_agent")
    client_id: str = Field(default="openclaw-control-ui", alias="client_id")
    client_version: str = Field(default="dev", alias="client_version")

    DESCRIPTIONS: ClassVar[Dict[str, Description]] = {
        "enabled": Description(
            en="Enable OpenClaw gateway event bridge",
            zh="启用 OpenClaw 网关事件桥接",
        ),
        "url": Description(
            en="OpenClaw gateway WebSocket URL (ws:// or wss://)",
            zh="OpenClaw 网关 WebSocket 地址",
        ),
        "token": Description(
            en="Gateway auth token for connect",
            zh="connect 认证 token",
        ),
    }

