from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend_python_app.config import Settings, get_settings
from backend_python_app.services.metals_dev import MetalsDevError, fetch_gold_price

app = FastAPI(title="Gold Price Backend", version="1.1.0")

# Allow the React build (Vite dev or nginx) to call the API from localhost origins.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/gold-price")
async def read_gold_price(settings: Settings = Depends(get_settings)) -> JSONResponse:
    api_key = settings.metals_dev_api_key.get_secret_value() if settings.metals_dev_api_key else ""
    if not api_key:
        return JSONResponse(
            status_code=503,
            content={
                "error": "Live gold price is not configured yet.",
                "code": "METALS_DEV_API_KEY_MISSING",
                "setupHint": "Add METALS_DEV_API_KEY to .env and restart the dev server.",
            },
        )
    try:
        quote = await fetch_gold_price(api_key, str(settings.metals_dev_base_url))
    except MetalsDevError as exc:
        return JSONResponse(
            status_code=502,
            content={"error": str(exc), "code": "METALS_DEV_REQUEST_FAILED"},
        )
    return JSONResponse(content=quote.model_dump())
