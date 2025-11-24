import sys
from pathlib import Path
from sqlalchemy import inspect

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.db.database import engine
from app.core.config import settings

def debug_db():
    print("=== DEBUG INFO ===")
    print(f"Config DATABASE_URL: {settings.DATABASE_URL}")
    print(f"Engine URL: {engine.url}")
    
    try:
        insp = inspect(engine)
        tables = insp.get_table_names()
        print(f"Tables found: {tables}")
    except Exception as e:
        print(f"❌ Error inspecting DB: {e}")

if __name__ == "__main__":
    debug_db()
