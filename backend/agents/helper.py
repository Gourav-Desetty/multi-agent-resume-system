import json
import re
from backend.config import settings, logger

def parse_json_safely(text: str) -> dict:
    """Extracts JSON from text, stripping markdown code blocks if necessary."""
    text_clean = text.strip()
    # Strip markdown block if exists
    if text_clean.startswith("```"):
        # Match ```json ... ``` or ``` ... ```
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text_clean)
        if match:
            text_clean = match.group(1).strip()
            
    try:
        return json.loads(text_clean)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to decode JSON from text: {text_clean}. Error: {e}")
        # Return fallback empty structure
        return {}

def _active_llm_provider() -> str:
    provider = (settings.LLM_PROVIDER or "groq").lower()
    has_groq = bool(settings.GROQ_API_KEY)

    if provider in {"groq", "auto"} and has_groq:
        return "groq"
    return ""

def is_llm_configured() -> bool:
    return bool(_active_llm_provider())

def is_groq_configured() -> bool:
    return is_llm_configured()

def call_llm(prompt: str) -> str:
    """Call Groq chat completions when configured, otherwise return fallback signal."""
    provider = _active_llm_provider()
    if not provider:
        return ""
        
    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)

        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful recruitment system assistant. Output valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"Groq completion call error: {e}")
        return ""
