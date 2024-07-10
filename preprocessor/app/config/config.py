import os

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

class Settings(BaseSettings):
    database_url: str =os.getenv("DATABASE_URL")

settings = Settings()