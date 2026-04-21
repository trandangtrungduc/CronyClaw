# config_manager/system.py
from pydantic import Field, model_validator
from typing import Dict, ClassVar, Optional
from .i18n import I18nMixin, Description
from .openclaw_bridge_settings import OpenClawBridgeSettings


class SystemConfig(I18nMixin):
    """System configuration settings."""

    conf_version: str = Field(..., alias="conf_version")
    host: str = Field(..., alias="host")
    port: int = Field(..., alias="port")
    config_alts_dir: str = Field(..., alias="config_alts_dir")
    tool_prompts: Dict[str, str] = Field(..., alias="tool_prompts")
    enable_proxy: bool = Field(False, alias="enable_proxy")
    openclaw_bridge: Optional[OpenClawBridgeSettings] = Field(
        default=None, alias="openclaw_bridge"
    )

    DESCRIPTIONS: ClassVar[Dict[str, Description]] = {
        "conf_version": Description(
            en="Configuration version", vi="Phiên bản cấu hình"
        ),
        "host": Description(en="Server host address", vi="Địa chỉ host của server"),
        "port": Description(en="Server port number", vi="Cổng của server"),
        "config_alts_dir": Description(
            en="Directory for alternative configurations",
            vi="Thư mục chứa các cấu hình thay thế",
        ),
        "tool_prompts": Description(
            en="Tool prompts to be inserted into persona prompt",
            vi="Các prompt công cụ sẽ được chèn vào prompt nhân vật",
        ),
        "enable_proxy": Description(
            en="Enable proxy mode for multiple clients",
            vi="Bật chế độ proxy để hỗ trợ nhiều client dùng chung một kết nối WS",
        ),
        "openclaw_bridge": Description(
            en="OpenClaw gateway bridge (optional)",
            vi="Cầu nối gateway OpenClaw (tùy chọn)",
        ),
    }


    @model_validator(mode="after")
    def check_port(cls, values):
        port = values.port
        if port < 0 or port > 65535:
            raise ValueError("Port must be between 0 and 65535")
        return values
