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
from backend_python_app.services.metals_dev import MetalsDevError, fetch_gold_price


def _make_client(handler):
    return httpx.MockTransport(handler)


class SettingsTests(unittest.TestCase):
    def tearDown(self) -> None:
        get_settings.cache_clear()

    def test_reads_env_and_caches(self) -> None:
        with patch.dict(
            os.environ,
            {"METALS_DEV_API_KEY": "env-key", "METALS_DEV_BASE_URL": "https://api.metals.dev", "BACKEND_PORT": "3001"},
            clear=False,
        ):
            get_settings.cache_clear()
            s = get_settings()
            self.assertEqual(s.metals_dev_api_key.get_secret_value(), "env-key")
            self.assertEqual(s.backend_port, 3001)
            self.assertIs(s, get_settings())


class FetchGoldPriceTests(unittest.IsolatedAsyncioTestCase):
    async def test_success_maps_response(self) -> None:
        def handler(req: httpx.Request) -> httpx.Response:
            self.assertEqual(req.method, "GET")
            self.assertIn("/v1/metal/spot", str(req.url))
            self.assertEqual(req.url.params["api_key"], "k")
            self.assertEqual(req.url.params["metal"], "gold")
            return httpx.Response(200, json={
                "metal": "gold", "currency": "USD", "unit": "toz",
                "timestamp": "2026-04-20T12:00:00Z",
                "rate": {"price": 1.0, "ask": 2.0, "bid": 3.0, "high": 4.0, "low": 5.0, "change": 6.0, "change_percent": 7.0},
            })

        quote = await fetch_gold_price("k", transport=_make_client(handler))
        self.assertEqual(quote.price, 1.0)
        self.assertEqual(quote.changePercent, 7.0)

    async def test_failure_payload_raises(self) -> None:
        t = _make_client(lambda _: httpx.Response(200, json={"status": "failure", "error": "Bad key"}))
        with self.assertRaisesRegex(MetalsDevError, "Bad key"):
            await fetch_gold_price("k", transport=t)

    async def test_failure_payload_with_message_fallback(self) -> None:
        t = _make_client(lambda _: httpx.Response(200, json={"status": "failure", "message": "Rate limit"}))
        with self.assertRaisesRegex(MetalsDevError, "Rate limit"):
            await fetch_gold_price("k", transport=t)

    async def test_failure_payload_default_message(self) -> None:
        t = _make_client(lambda _: httpx.Response(200, json={"status": "failure"}))
        with self.assertRaisesRegex(MetalsDevError, "Unable to fetch"):
            await fetch_gold_price("k", transport=t)

    async def test_unreadable_response_raises(self) -> None:
        t = _make_client(lambda _: httpx.Response(200, text="not-json"))
        with self.assertRaisesRegex(MetalsDevError, "unreadable"):
            await fetch_gold_price("k", transport=t)

    async def test_http_error_non_json_raises(self) -> None:
        t = _make_client(lambda _: httpx.Response(500, text="<html>oops</html>"))
        with self.assertRaisesRegex(MetalsDevError, "HTTP 500"):
            await fetch_gold_price("k", transport=t)

    async def test_network_error_raises(self) -> None:
        def handler(req: httpx.Request) -> httpx.Response:
            raise httpx.ConnectError("boom", request=req)
        with self.assertRaisesRegex(MetalsDevError, "Unable to reach"):
            await fetch_gold_price("k", transport=_make_client(handler))


class GoldPriceApiTests(unittest.TestCase):
    def setUp(self) -> None:
        app.dependency_overrides.clear()
        get_settings.cache_clear()
        self.client = TestClient(app)

    def tearDown(self) -> None:
        self.client.close()
        app.dependency_overrides.clear()
        get_settings.cache_clear()

    def test_requires_api_key(self) -> None:
        app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None)
        r = self.client.get("/api/gold-price")
        self.assertEqual(r.status_code, 503)
        self.assertEqual(r.json()["code"], "METALS_DEV_API_KEY_MISSING")

    def test_returns_quote(self) -> None:
        app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None, metals_dev_api_key="k")
        quote = GoldPriceResponse(timestamp="2026-04-20T12:00:00Z", price=10.0, changePercent=0.5)
        with patch("backend_python_app.main.fetch_gold_price", new=AsyncMock(return_value=quote)) as fn:
            r = self.client.get("/api/gold-price")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["price"], 10.0)
        fn.assert_awaited_once()

    def test_returns_upstream_error(self) -> None:
        app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None, metals_dev_api_key="k")
        with patch(
            "backend_python_app.main.fetch_gold_price",
            new=AsyncMock(side_effect=MetalsDevError("down")),
        ):
            r = self.client.get("/api/gold-price")
        self.assertEqual(r.status_code, 502)
        self.assertEqual(r.json(), {"error": "down", "code": "METALS_DEV_REQUEST_FAILED"})


class RunEntrypointTests(unittest.TestCase):
    def test_main_invokes_uvicorn_with_settings_port(self) -> None:
        run_py = Path(__file__).resolve().parents[3] / "run.py"
        spec = importlib.util.spec_from_file_location("backend_python_app_run", run_py)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        try:
            with patch.object(module, "uvicorn") as u, patch.object(
                module, "get_settings", return_value=Settings(_env_file=None, backend_port=4242)
            ):
                module.main()
        finally:
            get_settings.cache_clear()
        u.run.assert_called_once_with(
            "backend_python_app.main:app", host="127.0.0.1", port=4242, reload=False
        )
