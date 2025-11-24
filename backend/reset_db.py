import sys
from pathlib import Path

# Add the backend directory to the path so we can import app modules
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlmodel import SQLModel
from app.db.database import engine
# Import all models to ensure they are registered with SQLModel.metadata
from app.models import * 

from sqlmodel import text

def reset_database():
    print("⚠️  WARNING: This will DROP ALL DATA in the 'public' schema!")
    print(f"Target Database: {engine.url}")
    
    confirm = input("Are you sure you want to continue? (yes/no): ")
    if confirm.lower() != "yes":
        print("Operation cancelled.")
        return

    print("Resetting schema...")
    try:
        with engine.connect() as conn:
            conn.execute(text("DROP SCHEMA public CASCADE;"))
            conn.execute(text("CREATE SCHEMA public;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO public;")) # Optional: restore default grants
            conn.execute(text("GRANT ALL ON SCHEMA public TO siae_admin;")) # Ensure our user has access
            conn.commit()
        print("✅ Schema reset successfully.")
    except Exception as e:
        print(f"❌ Error resetting schema: {e}")
        return

    print("Recreating tables...")
    try:
        SQLModel.metadata.create_all(engine)
        print("✅ All tables created successfully.")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return

    print("\nDatabase reset complete.")
    print("Please restart the backend to seed initial data (Admin user, etc.).")

if __name__ == "__main__":
    reset_database()
