import os
import logging
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine project root and load environment
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(ROOT_DIR, ".env")

class Settings(BaseSettings):
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    SECRET_KEY: str = "devsecretkey1234567890defaultkeyforlocaltesting"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ENVIRONMENT: str = "development"

    # LLM Settings
    GROQ_API_KEY: str = ""
    LLM_PROVIDER: str = "groq"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Observability
    LANGFUSE_PUBLIC_KEY: str = ""
    LANGFUSE_SECRET_KEY: str = ""
    LANGFUSE_HOST: str = "https://cloud.langfuse.com"

    # Storage paths
    UPLOAD_DIR: str = "data/resumes"
    JD_DIR: str = "data/job_descriptions"
    DATABASE_FILE: str = "data/database.json"

    model_config = SettingsConfigDict(
        env_file=ENV_FILE, 
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Setup paths
os.makedirs(os.path.abspath(settings.UPLOAD_DIR), exist_ok=True)
os.makedirs(os.path.abspath(settings.JD_DIR), exist_ok=True)
os.makedirs(os.path.dirname(os.path.abspath(settings.DATABASE_FILE)), exist_ok=True)

# Logger Configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("recruitment-system")
