import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.db.database import engine
from sqlalchemy import inspect

def check():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables: {tables}")
    if "asistencias" in tables:
        print("Table 'asistencias' EXISTS.")
        columns = inspector.get_columns("asistencias")
        for col in columns:
            print(f"Column: {col['name']}, Type: {col['type']}, Nullable: {col['nullable']}")
    else:
        print("Table 'asistencias' MISSING.")

if __name__ == "__main__":
    check()
