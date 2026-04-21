import os
import sys
import atexit
import asyncio
import argparse
import subprocess
from pathlib import Path
import tomli
import uvicorn
from loguru import logger
from src.cronyclaw.server import WebSocketServer
from src.cronyclaw.config_manager import Config, read_yaml, validate_config

os.environ["HF_HOME"] = str(Path(__file__).parent / "models")
os.environ["MODELSCOPE_CACHE"] = str(Path(__file__).parent / "models")

def get_version() -> str:
    pyproject_path = Path(__file__).resolve().parent / "pyproject.toml"
    with pyproject_path.open("rb") as f:
        pyproject = tomli.load(f)
    return pyproject["project"]["version"]

def init_logger(console_log_level: str = "INFO") -> None:
    logger.remove()
    logger.add(
        sys.stderr,
        level=console_log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | {message}",
        colorize=True,
    )

    logger.add(
        "logs/debug_{time:YYYY-MM-DD}.log",
        rotation="10 MB",
        retention="30 days",
        level="DEBUG",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} | {message} | {extra}",
        backtrace=True,
        diagnose=True,
    )

def check_frontend_submodule(lang=None):
    if lang is None:
        lang = "en"

    frontend_path = Path(__file__).parent / "frontend" / "index.html"
    if not frontend_path.exists():
        if lang == "vi":
            logger.warning("Không tìm thấy submodule frontend, đang thử khởi tạo submodule...")
        else:
            logger.warning(
                "Frontend submodule not found, attempting to initialize submodules..."
            )

        try:
            subprocess.run(
                ["git", "submodule", "update", "--init", "--recursive"], check=True
            )
            if frontend_path.exists():
                if lang == "vi":
                    logger.info("👍 Đã khởi tạo thành công submodule frontend (và các submodule khác).")
                else:
                    logger.info(
                        "👍 Frontend submodule (and other submodules) initialized successfully."
                    )
            else:
                if lang == "vi":
                    logger.critical(
                        'Khởi tạo submodule thất bại.\nBạn có thể sẽ thấy lỗi {{"detail":"Not Found"}} trên trình duyệt. Vui lòng xem hướng dẫn bắt đầu nhanh và trang FAQ để biết thêm chi tiết.'
                    )
                    logger.error(
                        "Sau khi khởi tạo submodule, file frontend vẫn bị thiếu.\n"
                        + "Bạn có đã tự chỉnh sửa hoặc xóa thư mục `frontend` không?\n"
                        + "Đây là Git submodule - bạn không nên sửa trực tiếp nó.\n"
                        + "Nếu đã sửa/xóa, hãy dùng `git restore frontend` để bỏ thay đổi rồi thử lại.\n"
                    )
                else:
                    logger.critical(
                        'Failed to initialize submodules. \nYou might see {{"detail":"Not Found"}} in your browser. Please check our quick start guide and common issues page from our documentation.'
                    )
                    logger.error(
                        "Frontend files are still missing after submodule initialization.\n"
                        + "Did you manually change or delete the `frontend` folder?  \n"
                        + "It's a Git submodule — you shouldn't modify it directly.  \n"
                        + "If you did, discard your changes with `git restore frontend`, then try again.\n"
                    )
        except Exception as e:
            if lang == "vi":
                logger.critical(
                    f'Khởi tạo submodule thất bại: {e}.\nCó thể bạn đang gặp vấn đề kết nối tới GitHub. Bạn có thể sẽ thấy lỗi {{"detail":"Not Found"}} trên trình duyệt. Vui lòng xem hướng dẫn bắt đầu nhanh và trang FAQ để biết thêm chi tiết.\n'
                )
            else:
                logger.critical(
                    f'Failed to initialize submodules: {e}. \nYou might see {{"detail":"Not Found"}} in your browser. Please check our quick start guide and common issues page from our documentation.\n'
                )


def parse_args():
    parser = argparse.ArgumentParser(description="CronyClaw Server")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")
    parser.add_argument(
        "--hf_mirror", action="store_true", help="Use Hugging Face mirror"
    )
    return parser.parse_args()


@logger.catch
def run(console_log_level: str):
    init_logger(console_log_level)
    logger.info(f"CronyClaw, version v{get_version()}")

    check_frontend_submodule()

    atexit.register(WebSocketServer.clean_cache)

    config: Config = validate_config(read_yaml("conf.yaml"))
    server_config = config.system_config

    if server_config.enable_proxy:
        logger.info("Proxy mode enabled - /proxy-ws endpoint will be available")

    server = WebSocketServer(config=config)
    logger.info("Initializing server context...")
    try:
        asyncio.run(server.initialize())
        logger.info("Server context initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize server context: {e}")
        sys.exit(1)

    logger.info(f"Starting server on {server_config.host}:{server_config.port}")
    uvicorn.run(
        app=server.app,
        host=server_config.host,
        port=server_config.port,
        log_level=console_log_level.lower(),
    )

if __name__ == "__main__":
    args = parse_args()
    console_log_level = "DEBUG" if args.verbose else "INFO"
    if args.verbose:
        logger.info("Running in verbose mode")
    else:
        logger.info(
            "Running in standard mode. For detailed debug logs, use: uv run run_server.py --verbose"
        )
    if args.hf_mirror:
        os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"
    run(console_log_level=console_log_level)
