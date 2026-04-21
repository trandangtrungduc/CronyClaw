"""
CronyClaw Server
========================
This module contains the WebSocket server for CronyClaw, which handles
the WebSocket connections, serves static files, and manages the web tool.
It uses FastAPI for the server and Starlette for static file serving.
"""

import asyncio
import os
import shutil
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI
from loguru import logger
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import Response
from starlette.staticfiles import StaticFiles as StarletteStaticFiles

from .routes import init_client_ws_route, init_webtool_routes, init_proxy_route
from .service_context import ServiceContext
from .config_manager.utils import Config


class CORSStaticFiles(StarletteStaticFiles):
    """
    Static files handler that adds CORS headers to all responses.
    Needed because Starlette StaticFiles might bypass standard middleware.
    """

    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)

        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"

        if path.endswith(".js"):
            response.headers["Content-Type"] = "application/javascript"

        return response


class AvatarStaticFiles(CORSStaticFiles):
    """
    Avatar files handler with security restrictions and CORS headers
    """

    async def get_response(self, path: str, scope):
        allowed_extensions = (".jpg", ".jpeg", ".png", ".gif", ".svg")
        if not any(path.lower().endswith(ext) for ext in allowed_extensions):
            return Response("Forbidden file type", status_code=403)
        response = await super().get_response(path, scope)
        return response


class WebSocketServer:
    """
    API server for CronyClaw. This contains the websocket endpoint for the client, hosts the web tool, and serves static files.

    Creates and configures a FastAPI app, registers all routes
    (WebSocket, web tools, proxy) and mounts static assets with CORS.

    Args:
        config (Config): Application configuration containing system settings.
        default_context_cache (ServiceContext, optional):
            Pre‑initialized service context for sessions' service context to reference to.
            **If omitted, `initialize()` method needs to be called to load service context.**

    Notes:
        - If default_context_cache is omitted, call `await initialize()` to load service context cache.
        - Use `clean_cache()` to clear and recreate the local cache directory.
    """

    def __init__(self, config: Config, default_context_cache: ServiceContext = None):
        self.config = config
        self.default_context_cache = (
            default_context_cache or ServiceContext()
        )
        self._openclaw_bridge_task: Optional[asyncio.Task] = None

        @asynccontextmanager
        async def lifespan(app: FastAPI):
            from .openclaw_bridge.client import OpenClawBridgeRunner
            from .openclaw_bridge.runtime import resolve_openclaw_bridge_runtime

            runtime = resolve_openclaw_bridge_runtime(self.config.system_config)
            runner: OpenClawBridgeRunner | None = None
            self.default_context_cache.openclaw_bridge_runner = None
            self.default_context_cache.openclaw_bridge_task = None
            if runtime:
                runner = OpenClawBridgeRunner(
                    runtime,
                    lambda: getattr(
                        self.default_context_cache, "websocket_handler", None
                    ),
                )
                self.default_context_cache.openclaw_bridge_runner = runner
                logger.info("OpenClaw bridge runner ready (manual connect mode)")
            yield
            if runner is not None:
                runner.stop()
            task = getattr(self.default_context_cache, "openclaw_bridge_task", None)
            if task:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
                self.default_context_cache.openclaw_bridge_task = None

        self.app = FastAPI(title="CronyClaw Server", lifespan=lifespan)

        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        self.app.include_router(
            init_client_ws_route(default_context_cache=self.default_context_cache),
        )
        self.app.include_router(
            init_webtool_routes(default_context_cache=self.default_context_cache),
        )

        system_config = config.system_config
        if hasattr(system_config, "enable_proxy") and system_config.enable_proxy:
            host = system_config.host
            port = system_config.port
            server_url = f"ws://{host}:{port}/client-ws"
            self.app.include_router(
                init_proxy_route(server_url=server_url),
            )

        if not os.path.exists("cache"):
            os.makedirs("cache")
        self.app.mount(
            "/cache",
            CORSStaticFiles(directory="cache"),
            name="cache",
        )

        self.app.mount(
            "/live2d-models",
            CORSStaticFiles(directory="live2d-models"),
            name="live2d-models",
        )
        self.app.mount(
            "/bg",
            CORSStaticFiles(directory="backgrounds"),
            name="backgrounds",
        )
        self.app.mount(
            "/avatars",
            AvatarStaticFiles(directory="avatars"),
            name="avatars",
        )

        self.app.mount(
            "/web-tool",
            CORSStaticFiles(directory="web_tool", html=True),
            name="web_tool",
        )

        self.app.mount(
            "/",
            CORSStaticFiles(directory="frontend", html=True),
            name="frontend",
        )

    async def initialize(self):
        """Asynchronously load the service context from config.
        Calling this function is needed if default_context_cache was not provided to the constructor."""
        await self.default_context_cache.load_from_config(self.config)

    @staticmethod
    def clean_cache():
        """Clean the cache directory by removing and recreating it."""
        cache_dir = "cache"
        preserve_names = {
            "openclaw_bridge_device.key",
            "openclaw_bridge_device_token.json",
        }
        if os.path.exists(cache_dir):
            preserve: list[tuple[str, bytes]] = []
            for name in preserve_names:
                path = os.path.join(cache_dir, name)
                if os.path.isfile(path):
                    with open(path, "rb") as f:
                        preserve.append((name, f.read()))
            shutil.rmtree(cache_dir)
            os.makedirs(cache_dir)
            for name, data in preserve:
                path = os.path.join(cache_dir, name)
                with open(path, "wb") as f:
                    f.write(data)
