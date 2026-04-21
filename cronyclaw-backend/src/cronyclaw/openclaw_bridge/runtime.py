import os

from ..config_manager.system import SystemConfig
from .config_types import OpenClawBridgeRuntime


def resolve_openclaw_bridge_runtime(
    system_config: SystemConfig,
) -> OpenClawBridgeRuntime | None:
    y = system_config.openclaw_bridge
    if y is not None and not y.enabled:
        return None
    url_env = (os.environ.get("OPENCLAW_GATEWAY_URL") or "").strip()
    token_env = (os.environ.get("OPENCLAW_GATEWAY_TOKEN") or "").strip()
    url_yaml = (y.url if y else "").strip()
    token_yaml = (y.token if y else "").strip()
    password_yaml = (y.password if y else "").strip()
    url = url_env or url_yaml
    if not url:
        return None
    token = token_env or token_yaml
    password = password_yaml
    claw_name = y.claw_name if y else "OpenClaw"
    min_interval_ms = y.min_interval_ms if y else 2000
    notify_chat_final = y.notify_chat_final if y else True
    notify_agent = y.notify_agent if y else False
    client_id = y.client_id if y else "openclaw-control-ui"
    client_version = y.client_version if y else "dev"
    return OpenClawBridgeRuntime(
        url=url,
        token=token,
        password=password,
        claw_name=claw_name,
        min_interval_ms=min_interval_ms,
        notify_chat_final=notify_chat_final,
        notify_agent=notify_agent,
        client_id=client_id,
        client_version=client_version,
    )
