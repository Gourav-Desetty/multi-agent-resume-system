import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.api.auth import check_role, get_current_user
from backend.agents.helper import _active_llm_provider
from backend.config import ENV_FILE, settings
from backend.models.schemas import UserResponse

router = APIRouter(prefix="/settings", tags=["Settings"])


class LLMSettingsPayload(BaseModel):
    groq_api_key: str = Field(default="", min_length=0)


def _masked_key(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "****"
    return f"{value[:4]}...{value[-4:]}"


def _write_env_value(key: str, value: str) -> None:
    env_path = Path(ENV_FILE)
    lines = []
    found = False

    if env_path.exists():
        lines = env_path.read_text(encoding="utf-8").splitlines()

    next_lines = []
    for line in lines:
        if line.startswith(f"{key}="):
            next_lines.append(f'{key}="{value}"')
            found = True
        else:
            next_lines.append(line)

    if not found:
        next_lines.append(f'{key}="{value}"')

    env_path.write_text(os.linesep.join(next_lines) + os.linesep, encoding="utf-8")


@router.get("/llm")
async def get_llm_settings(current_user: UserResponse = Depends(get_current_user)):
    return {
        "provider": _active_llm_provider() or "fallback",
        "configured": bool(settings.GROQ_API_KEY),
        "groq_configured": bool(settings.GROQ_API_KEY),
        "groq_api_key_masked": _masked_key(settings.GROQ_API_KEY),
        "model": settings.GROQ_MODEL,
    }


@router.post("/llm")
async def update_llm_settings(
    payload: LLMSettingsPayload,
    current_user: UserResponse = Depends(check_role(["Admin"])),
):
    groq_api_key = payload.groq_api_key.strip()
    if not groq_api_key:
        raise HTTPException(status_code=400, detail="Groq API key is required.")

    settings.GROQ_API_KEY = groq_api_key
    _write_env_value("GROQ_API_KEY", groq_api_key)

    return {
        "provider": "groq",
        "configured": True,
        "groq_configured": True,
        "groq_api_key_masked": _masked_key(settings.GROQ_API_KEY),
        "model": settings.GROQ_MODEL,
    }
