from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str

    google_service_account_file: str
    google_drive_folder_id: str
    drive_poll_interval_seconds: int = 30

    nuvemshop_api_base: str = "https://api.nuvemshop.com.br/2025-03"
    nuvemshop_user_agent: str = "PrimeImportaProduto (contato@suaempresa.com.br)"

    frontend_origin: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
