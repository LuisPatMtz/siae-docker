import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.db.database import create_db_and_tables, engine
from sqlmodel import Session, text
import app.models  # Register models

def init():
    print("Creating tables...")
    create_db_and_tables()
    print("Tables created.")
    
    # Verify if table exists
    with Session(engine) as session:
        try:
            session.exec(text("SELECT 1 FROM asistencias LIMIT 1"))
            print("Table 'asistencias' exists.")
        except Exception as e:
            print(f"Error checking table: {e}")

if __name__ == "__main__":
    init()
