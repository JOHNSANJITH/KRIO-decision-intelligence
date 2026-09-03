from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_FILE = BASE_DIR / "data" / "demo_monthly_data.csv"
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv("KRIO_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if origin.strip()]
