import os
from dotenv import load_dotenv

load_dotenv()

# Defaults to a local SQLite file so the project runs with zero setup.
# For the intended stack (PostgreSQL), set DATABASE_URL, e.g.:
# postgresql+psycopg2://formuser:formpass@localhost:5432/formplatform
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./formplatform.db")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:5173")
