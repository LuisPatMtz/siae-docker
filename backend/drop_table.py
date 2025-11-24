"""
Simple script to drop the asistencias table before restarting the backend.
"""
from sqlmodel import create_engine, text, Session
from app.core.config import settings

def drop_asistencias_table():
    """Drop the asistencias table."""
    engine = create_engine(settings.DATABASE_URL)
    
    print("🔄 Dropping asistencias table...")
    try:
        with Session(engine) as session:
            session.exec(text("DROP TABLE IF EXISTS asistencias CASCADE"))
            session.commit()
        print("✅ Table dropped successfully!")
        print("\n📝 Next step: Restart the backend server to recreate the table with the new schema.")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    drop_asistencias_table()
