"""Pydantic response models for the gold price API."""

from pydantic import BaseModel


class GoldPriceResponse(BaseModel):
    # This response shape matches the fields already used by the React client.
    source: str = "Metals.dev"
    metal: str = "gold"
    currency: str = "USD"
    unit: str = "toz"
    timestamp: str
    price: float | None = None
    ask: float | None = None
    bid: float | None = None
    high: float | None = None
    low: float | None = None
    change: float | None = None
    changePercent: float | None = None
