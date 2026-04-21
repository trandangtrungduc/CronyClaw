from dataclasses import dataclass


@dataclass(frozen=True)
class OpenClawBridgeRuntime:
    url: str
    token: str
    password: str
    claw_name: str
    min_interval_ms: int
    notify_chat_final: bool
    notify_agent: bool
    client_id: str
    client_version: str
