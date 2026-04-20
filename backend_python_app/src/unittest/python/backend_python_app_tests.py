"""Unit tests for the FastAPI backend and Metals.dev client."""

import importlib.util
import os
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from backend_python_app.config import Settings, get_settings
from backend_python_app.main import app
from backend_python_app.models import GoldPriceResponse
from backend_python_app.services.metals_dev import MetalsDevClient, MetalsDevError


class SettingsTests(unittest.TestCase):
    def tearDown(self) -> None:
        get_settings.cache_clear()

    def test_get_settings_reads_and_caches_environment_values(self) -> None:
        with patch.dict(
            os.environ,
            {
                "METALS_DEV_API_KEY": "env-key",
                "METALS_DEV_BASE_URL": "https://api.metals.dev",
                "BACKEND_PORT": "3001",
            },
            clear=False,
        ):
            get_settings.cache_clear()

            settings = get_settings()

            self.assertEqual(settings.metals_dev_api_key.get_secret_value(), "env-key")
            self.assertEqual(str(settings.metals_dev_base_url), "https://api.metals.dev/")
            self.assertEqual(settings.backend_port, 3001)
            self.assertIs(settings, get_settings())


class MetalsDevClientTests(unittest.IsolatedAsyncioTestCase):
    async def test_fetch_latest_gold_price_maps_successful_response(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual(request.method, "GET")
            self.assertIn("/v1/metal/spot", str(request.url))
            self.assertEqual(request.url.params["api_key"], "test-key")
            self.assertEqual(request.url.params["metal"], "gold")
            self.assertEqual(request.url.params["currency"], "USD")
            return httpx.Response(
                200,
                json={
                    "metal": "gold",
                    "currency": "USD",
                    "unit": "toz",
                    "timestamp": "2026-04-20T12:34:56Z",
                    "rate": {
                        "price": 2425.5,
                        "ask": 2426.1,
                        "bid": 2424.9,
                        "high": 2430.0,
                        "low": 2410.0,
                        "change": 10.5,
                        "change_percent": 0.43,
                    },
                },
            )

        client = MetalsDevClient(api_key="test-key", transport=httpx.MockTransport(handler))

        quote = await client.fetch_latest_gold_price()

        self.assertEqual(
            quote.model_dump(),
            {
                "source": "Metals.dev",
                "metal": "gold",
                "currency": "USD",
                "unit": "toz",
                "timestamp": "2026-04-20T12:34:56Z",
                "price": 2425.5,
                "ask": 2426.1,
                "bid": 2424.9,
                "high": 2430.0,
                "low": 2410.0,
                "change": 10.5,
                "changePercent": 0.43,
            },
        )

    async def test_fetch_latest_gold_price_raises_for_failure_payload(self) -> None:
        client = MetalsDevClient(
            api_key="test-key",
            transport=httpx.MockTransport(
                lambda request: httpx.Response(200, json={"status": "failure", "error": "Bad API key"})
            ),
        )

        with self.assertRaisesRegex(MetalsDevError, "Bad API key"):
            await client.fetch_latest_gold_price()

    async def test_fetch_latest_gold_price_raises_for_unreadable_payload(self) -> None:
        client = MetalsDevClient(
            api_key="test-key",
            transport=httpx.MockTransport(lambda request: httpx.Response(200, text="not-json")),
        )

        with self.assertRaisesRegex(MetalsDevError, "unreadable"):
            await client.fetch_latest_gold_price()

    async def test_fetch_latest_gold_price_raises_for_network_errors(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            raise httpx.ConnectError("boom", request=request)

        client = MetalsDevClient(api_key="test-key", transport=httpx.MockTransport(handler))

        with self.assertRaisesRegex(MetalsDevError, "Unable to reach Metals.dev"):
            await client.fetch_latest_gold_price()

    async def test_fetch_latest_gold_price_raises_for_http_error_with_non_json_body(self) -> None:
        client = MetalsDevClient(
            api_key="test-key",
            transport=httpx.MockTransport(
                lambda request: httpx.Response(500, text="<html>oops</html>")
            ),
        )

        with self.assertRaisesRegex(MetalsDevError, "HTTP 500"):
            await client.fetch_latest_gold_price()


class GoldPriceApiTests(unittest.TestCase):
    def setUp(self) -> None:
        app.dependency_overrides.clear()
        get_settings.cache_clear()
        self.client = TestClient(app)

    def tearDown(self) -> None:
        self.client.close()
        app.dependency_overrides.clear()
        get_settings.cache_clear()

    def test_gold_price_endpoint_requires_api_key(self) -> None:
        app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None)

        response = self.client.get("/api/gold-price")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json(),
            {
                "error": "Live gold price is not configured yet.",
                "code": "METALS_DEV_API_KEY_MISSING",
                "setupHint": "Add METALS_DEV_API_KEY to .env and restart the dev server.",
            },
        )

    def test_gold_price_endpoint_returns_latest_quote(self) -> None:
        app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None, metals_dev_api_key="test-key")
        quote = GoldPriceResponse(
            timestamp="2026-04-20T12:34:56Z",
            price=2425.5,
            ask=2426.1,
            bid=2424.9,
            high=2430.0,
            low=2410.0,
            change=10.5,
            changePercent=0.43,
        )

        with patch(
            "backend_python_app.main.MetalsDevClient.fetch_latest_gold_price",
            new=AsyncMock(return_value=quote),
        ) as fetch_mock:
            response = self.client.get("/api/gold-price")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["price"], 2425.5)
        self.assertEqual(response.json()["changePercent"], 0.43)
        fetch_mock.assert_awaited_once()

    def test_gold_price_endpoint_returns_upstream_errors(self) -> None:
        app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None, metals_dev_api_key="test-key")

        with patch(
            "backend_python_app.main.MetalsDevClient.fetch_latest_gold_price",
            new=AsyncMock(side_effect=MetalsDevError("Metals.dev is temporarily unavailable.")),
        ):
            response = self.client.get("/api/gold-price")

        self.assertEqual(response.status_code, 502)
        self.assertEqual(
            response.json(),
            {
                "error": "Metals.dev is temporarily unavailable.",
                "code": "METALS_DEV_REQUEST_FAILED",
            },
        )


class RunEntrypointTests(unittest.TestCase):
    def test_main_invokes_uvicorn_with_settings_port(self) -> None:
        run_py = Path(__file__).resolve().parents[3] / "run.py"
        spec = importlib.util.spec_from_file_location("backend_python_app_run", run_py)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        try:
            with patch.object(module, "uvicorn") as uvicorn_mod, patch.object(
                module,
                "get_settings",
                return_value=Settings(_env_file=None, backend_port=4242),
            ):
                module.main()
        finally:
            get_settings.cache_clear()

        uvicorn_mod.run.assert_called_once_with(
            "backend_python_app.main:app",
            host="127.0.0.1",
            port=4242,
            reload=False,
        )
