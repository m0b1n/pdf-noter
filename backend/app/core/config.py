from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    database_url: str = "sqlite:///./pdfnoter.db"
    # repo_root/pdfs (backend folder is repo_root/backend)
    pdf_dir: str = str((Path(__file__).resolve().parents[3] / "pdfs").resolve())

settings = Settings()