import httpx

from backend_python_app.models import GoldPriceResponse


class MetalsDevError(Exception):
    pass


async def fetch_gold_price(
    api_key: str,
    base_url: str = "https://api.metals.dev",
    *,
    timeout: float = 10.0,
    transport: httpx.AsyncBaseTransport | None = None,
) -> GoldPriceResponse:
    params = {"api_key": api_key, "metal": "gold", "currency": "USD"}
    try:
        async with httpx.AsyncClient(timeout=timeout, transport=transport) as client:
            response = await client.get(
                f"{base_url.rstrip('/')}/v1/metal/spot",
                params=params,
                headers={"Accept": "application/json"},
            )
    except httpx.HTTPError as exc:
        raise MetalsDevError("Unable to reach Metals.dev for the latest gold price.") from exc

    try:
        payload = response.json()
    except ValueError as exc:
        # HTTP status wins over JSON parse: error body need not be JSON.
        if response.is_error:
            raise MetalsDevError(f"Metals.dev returned HTTP {response.status_code}.") from exc
        raise MetalsDevError("Metals.dev returned an unreadable response.") from exc

    if response.is_error or payload.get("status") == "failure":
        msg = payload.get("error") or payload.get("message") or "Unable to fetch gold price from Metals.dev."
        raise MetalsDevError(msg)

    rate = payload.get("rate") or {}
    return GoldPriceResponse(
        metal=payload.get("metal") or "gold",
        currency=payload.get("currency") or "USD",
        unit=payload.get("unit") or "toz",
        timestamp=payload.get("timestamp") or "",
        price=rate.get("price"),
        ask=rate.get("ask"),
        bid=rate.get("bid"),
        high=rate.get("high"),
        low=rate.get("low"),
        change=rate.get("change"),
        changePercent=rate.get("change_percent"),
    )
