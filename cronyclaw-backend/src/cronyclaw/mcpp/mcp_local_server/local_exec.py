import re
import subprocess
import time
from pathlib import Path

from mcp.server.fastmcp import FastMCP


mcp = FastMCP("local-exec")

MAX_TIMEOUT_SEC = 120
DEFAULT_TIMEOUT_SEC = 30
MAX_OUTPUT_CHARS = 64000
ALLOWED_SHELLS = {"bash", "powershell"}
BLOCKED_PATTERNS = [
    r"\brm\s+-rf\b",
    r"\bshutdown\b",
    r"\breboot\b",
    r"\bmkfs\b",
    r"\bdd\b",
    r"\bformat\b",
]
BLOCKED_OPERATORS = ["&&", "||", ";", "|"]


def _truncate(value: str) -> str:
    if len(value) <= MAX_OUTPUT_CHARS:
        return value
    return value[:MAX_OUTPUT_CHARS] + "\n...[truncated]..."


def _normalize_timeout(timeout_sec: int | None) -> int:
    if timeout_sec is None:
        return DEFAULT_TIMEOUT_SEC
    if timeout_sec < 1:
        return 1
    if timeout_sec > MAX_TIMEOUT_SEC:
        return MAX_TIMEOUT_SEC
    return timeout_sec


def _is_blocked_command(command: str) -> str | None:
    lowered = command.lower()
    for op in BLOCKED_OPERATORS:
        if op in command:
            return f"Command contains blocked operator '{op}'"
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, lowered):
            return f"Command matches blocked pattern '{pattern}'"
    return None


def _resolve_cwd(cwd: str | None) -> str:
    base = Path.cwd().resolve()
    if not cwd:
        return str(base)
    target = Path(cwd)
    if not target.is_absolute():
        target = (base / target).resolve()
    else:
        target = target.resolve()
    if not str(target).startswith(str(base)):
        raise ValueError("cwd must be inside workspace")
    if not target.exists() or not target.is_dir():
        raise ValueError("cwd must be an existing directory")
    return str(target)


def _build_command(command: str, shell: str, resolved_cwd: str) -> tuple[list[str], str | None]:
    if shell == "powershell":
        return [
            "powershell",
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            command,
        ], resolved_cwd

    escaped_cmd = command.replace("'", "'\"'\"'")
    escaped_cwd = resolved_cwd.replace("'", "'\"'\"'")
    bash_script = f"set -euo pipefail; cd '{escaped_cwd}'; {escaped_cmd}"
    return ["bash", "-lc", bash_script], None


@mcp.tool()
def exec(
    command: str,
    shell: str = "bash",
    cwd: str | None = None,
    timeout_sec: int = DEFAULT_TIMEOUT_SEC,
) -> str:
    shell = shell.strip().lower()
    if shell not in ALLOWED_SHELLS:
        return f"ok=false\nerror=Unsupported shell '{shell}'\nallowed={sorted(ALLOWED_SHELLS)}"

    blocked_reason = _is_blocked_command(command)
    if blocked_reason:
        return f"ok=false\nerror={blocked_reason}"

    try:
        resolved_cwd = _resolve_cwd(cwd)
    except Exception as e:
        return f"ok=false\nerror=Invalid cwd: {e}"

    timeout_value = _normalize_timeout(timeout_sec)
    started = time.perf_counter()
    cmd, run_cwd = _build_command(command, shell, resolved_cwd)

    try:
        proc = subprocess.run(
            cmd,
            cwd=run_cwd,
            capture_output=True,
            text=True,
            timeout=timeout_value,
        )
        duration_ms = int((time.perf_counter() - started) * 1000)
        stdout = _truncate(proc.stdout or "")
        stderr = _truncate(proc.stderr or "")
        return (
            f"ok={'true' if proc.returncode == 0 else 'false'}\n"
            f"shell={shell}\n"
            f"cwd={resolved_cwd}\n"
            f"timeout_sec={timeout_value}\n"
            f"exit_code={proc.returncode}\n"
            f"duration_ms={duration_ms}\n"
            f"stdout:\n{stdout}\n"
            f"stderr:\n{stderr}"
        )
    except subprocess.TimeoutExpired as e:
        duration_ms = int((time.perf_counter() - started) * 1000)
        out = _truncate((e.stdout or "") if isinstance(e.stdout, str) else "")
        err = _truncate((e.stderr or "") if isinstance(e.stderr, str) else "")
        return (
            "ok=false\n"
            "error=Command timed out\n"
            f"shell={shell}\n"
            f"cwd={resolved_cwd}\n"
            f"timeout_sec={timeout_value}\n"
            f"duration_ms={duration_ms}\n"
            f"stdout:\n{out}\n"
            f"stderr:\n{err}"
        )
    except Exception as e:
        return f"ok=false\nerror=Execution failed: {e}"


if __name__ == "__main__":
    mcp.run()
