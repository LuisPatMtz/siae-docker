#!/usr/bin/env python3
"""
Migration script to update Asistencia table schema.
Changes usuario_id foreign key to matricula_estudiante foreign key.

WARNING: This will drop the existing asistencias table and recreate it.
All existing attendance data will be lost.
"""

import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlmodel import SQLModel, create_engine, Session, select
from app.db.database import get_engine
from app.models import Asistencia, Estudiante, Usuario

def migrate_asistencia_table():
    """
    Drop and recreate the asistencias table with the new schema.
    """
    print("🔄 Starting migration: Asistencia table schema update")
    print("=" * 60)
    
    engine = get_engine()
    
    # Step 1: Drop the existing asistencias table
    print("\n📋 Step 1: Dropping existing 'asistencias' table...")
    try:
        with engine.begin() as conn:
            conn.exec_driver_sql("DROP TABLE IF EXISTS asistencias CASCADE")
        print("✅ Table dropped successfully")
    except Exception as e:
        print(f"❌ Error dropping table: {e}")
        return False
    
    # Step 2: Create the new asistencias table with updated schema
    print("\n📋 Step 2: Creating new 'asistencias' table with updated schema...")
    try:
        # Create only the Asistencia table
        Asistencia.__table__.create(engine, checkfirst=True)
        print("✅ Table created successfully with new schema:")
        print("   - Foreign key: matricula_estudiante -> estudiante.matricula")
        print("   - Relationship: estudiante (instead of usuario)")
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        return False
    
    # Step 3: Verify the migration
    print("\n📋 Step 3: Verifying migration...")
    try:
        with Session(engine) as session:
            # Try to query the new table (should be empty)
            result = session.exec(select(Asistencia)).all()
            print(f"✅ Migration verified. Table is ready (currently {len(result)} records)")
    except Exception as e:
        print(f"❌ Error verifying migration: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ Migration completed successfully!")
    print("\nNext steps:")
    print("1. Restart the FastAPI backend server")
    print("2. Test attendance registration via the UI")
    print("3. Verify that attendance records are being saved correctly")
    
    return True

if __name__ == "__main__":
    print("\n⚠️  WARNING: This migration will DROP the existing 'asistencias' table!")
    print("⚠️  All existing attendance data will be LOST!")
    
    response = input("\nDo you want to continue? (yes/no): ").strip().lower()
    
    if response == "yes":
        success = migrate_asistencia_table()
        sys.exit(0 if success else 1)
    else:
        print("\n❌ Migration cancelled by user")
        sys.exit(1)
