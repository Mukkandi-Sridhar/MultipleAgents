import os
from pydantic_settings import BaseSettings, SettingsConfigDict

from typing import Union, List
from pydantic import field_validator

class Settings(BaseSettings):
    port: int = 8000
    openai_api_key: str = ""
    frontend_origins: Union[str, List[str]] = ["http://localhost:5173"]

    @field_validator("frontend_origins", mode="before")
    @classmethod
    def parse_frontend_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    import json
                    return json.loads(v)
                except Exception:
                    pass
            return [x.strip() for x in v.split(",") if x.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        extra="ignore"
    )

settings = Settings()
