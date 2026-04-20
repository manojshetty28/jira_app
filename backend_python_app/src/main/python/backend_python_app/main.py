"""FastAPI application for serving the gold price endpoint."""

from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse

from backend_python_app.config import Settings, get_settings
from backend_python_app.services.metals_dev import MetalsDevClient, MetalsDevError


app = FastAPI(
    title="Gold Price Backend",
    version="1.0.0",
    description="Minimal FastAPI service for retrieving the latest gold price from Metals.dev.",
)


@app.get("/api/gold-price")
async def read_gold_price(settings: Settings = Depends(get_settings)) -> JSONResponse:
    # Return a setup-focused message until the server-side API key is configured.
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

    client = MetalsDevClient(api_key=api_key, base_url=str(settings.metals_dev_base_url))

    try:
        quote = await client.fetch_latest_gold_price()
    except MetalsDevError as exc:
        return JSONResponse(
            status_code=502,
            content={
                "error": str(exc),
                "code": "METALS_DEV_REQUEST_FAILED",
            },
        )

    return JSONResponse(content=quote.model_dump())
