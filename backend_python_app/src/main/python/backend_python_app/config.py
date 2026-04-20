"""Application settings loaded from environment variables."""

from functools import lru_cache

from pydantic import AnyHttpUrl, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Keep secrets in environment variables so the React client never sees them.
    metals_dev_api_key: SecretStr | None = None
    metals_dev_base_url: AnyHttpUrl = "https://api.metals.dev"
    backend_port: int = 3001

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    # Cache settings once per process to avoid repeated env parsing on each request.
    return Settings()
