"""Local entrypoint for running the FastAPI backend from the repo root."""

from pathlib import Path
import sys

import uvicorn


PROJECT_ROOT = Path(__file__).resolve().parent
SOURCE_ROOT = PROJECT_ROOT / "src" / "main" / "python"

if str(SOURCE_ROOT) not in sys.path:
    sys.path.insert(0, str(SOURCE_ROOT))

from backend_python_app.config import get_settings  # noqa: E402


def main() -> None:
    # Reuse the shared settings loader so local runs match tests and CI behavior.
    settings = get_settings()
    uvicorn.run(
        "backend_python_app.main:app",
        host="127.0.0.1",
        port=settings.backend_port,
        reload=False,
    )


if __name__ == "__main__":
    main()
