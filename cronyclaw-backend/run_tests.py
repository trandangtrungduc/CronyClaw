import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TESTS = ROOT / "tests"

_RUNTIME_IMPORTS = (
    ("pytest", "pytest"),
    ("pytest_asyncio", "pytest-asyncio"),
    ("fastapi", "fastapi"),
    ("pysbd", "pysbd"),
    ("pydub", "pydub"),
    ("soundfile", "soundfile"),
    ("langdetect", "langdetect"),
    ("aiohttp", "aiohttp"),
)


def _missing_runtime_modules():
    out = []
    if sys.version_info >= (3, 13):
        try:
            import audioop
        except ImportError:
            out.append("audioop-lts")
    for mod, pip_hint in _RUNTIME_IMPORTS:
        try:
            __import__(mod)
        except ImportError:
            out.append(pip_hint)
    return out


def resolve_target(first: str) -> Path:
    if Path(first).is_absolute():
        p = Path(first)
    elif first.replace("\\", "/").startswith("tests/"):
        p = ROOT / first
    else:
        p = TESTS / first
    return p.resolve()


def main() -> int:
    raw = list(sys.argv[1:])
    if "--skip-deps-check" in raw:
        raw = [a for a in raw if a != "--skip-deps-check"]
    elif raw and raw[0] not in ("-h", "--help"):
        missing = _missing_runtime_modules()
        if missing:
            print(
                "Some packages required for tests are missing in this interpreter:\n  "
                + ", ".join(missing)
                + "\n\nInstall the project and dev tools from the backend root, e.g.:\n"
                '  pip install -e ".[dev]"',
                file=sys.stderr,
            )
            print(
                "(This project declares requires-python; use a supported Python, or override with "
                "--skip-deps-check if you know the env is correct.)",
                file=sys.stderr,
            )
            return 2
    if not raw:
        target = TESTS
        extra = []
    else:
        if raw[0] in ("-h", "--help"):
            print(
                "Usage: python run_tests.py [PATH_UNDER_TESTS] [PYTEST_ARGS...]\n"
                "  PATH_UNDER_TESTS    optional, e.g. cronyclaw/mcpp or cronyclaw/asr\n"
                "  PYTEST_ARGS         passed through to pytest (-q, -k, --tb=short, ...)\n"
                "  --skip-deps-check   do not verify imports before running pytest\n"
                "\nExamples:\n"
                "  python run_tests.py\n"
                "  python run_tests.py cronyclaw/mcpp\n"
                "  python run_tests.py cronyclaw/mcpp -q --tb=short\n"
                "  python run_tests.py -q\n"
                "\nIf collection fails with ModuleNotFoundError, sync the env from this directory, e.g.:\n"
                '  uv sync --extra dev\n'
                '  pip install -e ".[dev]"\n'
            )
            return 0
        if raw[0].startswith("-"):
            target = TESTS
            extra = raw
        else:
            target = resolve_target(raw[0])
            extra = raw[1:]
            if not target.exists():
                print(f"Path not found: {target}", file=sys.stderr)
                return 1
    cmd = [sys.executable, "-m", "pytest", str(target), *extra]
    return subprocess.call(cmd, cwd=str(ROOT))


if __name__ == "__main__":
    raise SystemExit(main())
