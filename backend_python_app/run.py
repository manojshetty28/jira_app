import sys
from pathlib import Path

import uvicorn

# Local dev convenience: `python backend_python_app/run.py` without PYTHONPATH gymnastics.
sys.path.insert(0, str(Path(__file__).resolve().parent / "src" / "main" / "python"))

from backend_python_app.config import get_settings  # noqa: E402


def main() -> None:
    uvicorn.run("backend_python_app.main:app", host="127.0.0.1", port=get_settings().backend_port, reload=False)


if __name__ == "__main__":
    main()
