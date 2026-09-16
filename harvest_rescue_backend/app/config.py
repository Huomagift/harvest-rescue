"""
Centralized configuration. All environment-specific and secret values live
here, sourced from a .env file (never committed to git). Every other module
imports `settings` from here instead of reading os.environ directly —
one source of truth, no scattered config.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Auth: a shared secret your frontend sends on every request via the
    # X-API-Key header. Rotate it any time by changing the .env value —
    # no code changes needed.
    backend_api_key: str

    # Comma-separated list in .env, parsed into a list here.
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Google Cloud project tied to your Earth Engine account.
    gee_project_id: str | None = None

    database_url: str = "sqlite:///./harvest_rescue.db"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


settings = Settings()
