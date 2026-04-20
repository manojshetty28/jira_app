"""HTTP client helpers for the Metals.dev gold price endpoint."""

import httpx

from backend_python_app.models import GoldPriceResponse


class MetalsDevError(Exception):
    """Raised when Metals.dev cannot provide a valid gold price payload."""


class MetalsDevClient:
    """Minimal GET-only client for fetching the latest gold price from Metals.dev."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.metals.dev",
        timeout: float = 10.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._transport = transport

    async def fetch_latest_gold_price(self) -> GoldPriceResponse:
        params = {
            "api_key": self._api_key,
            "metal": "gold",
            "currency": "USD",
        }
        headers = {"Accept": "application/json"}

        try:
            async with httpx.AsyncClient(timeout=self._timeout, transport=self._transport) as client:
                # The integration intentionally uses one outbound GET request and no write operations.
                response = await client.get(f"{self._base_url}/v1/metal/spot", params=params, headers=headers)
        except httpx.HTTPError as exc:
            raise MetalsDevError("Unable to reach Metals.dev for the latest gold price.") from exc

        try:
            payload = response.json()
        except ValueError as exc:
            raise MetalsDevError("Metals.dev returned an unreadable response.") from exc

        if response.is_error or payload.get("status") == "failure":
            message = payload.get("error") or payload.get("message") or "Unable to fetch gold price from Metals.dev."
            raise MetalsDevError(message)

        rate = payload.get("rate") or {}
        return GoldPriceResponse(
            source="Metals.dev",
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
