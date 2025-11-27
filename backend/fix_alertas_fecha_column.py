# Script to fix alertas table - remove or make nullable the 'fecha' column
# The model doesn't use 'fecha', it uses 'fecha_creacion' instead

from sqlalchemy import create_engine, text
from app.core.config import settings

def fix_alertas_fecha_column():
    """Remove or make nullable the legacy 'fecha' column"""
    engine = create_engine(str(settings.DATABASE_URL))
    
    with engine.connect() as conn:
        # Check if 'fecha' column exists
        result = conn.execute(text("""
            SELECT column_name, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'alertas' AND column_name = 'fecha'
        """))
        fecha_col = result.first()
        
        if fecha_col:
            print(f"Found 'fecha' column (nullable: {fecha_col[1]})")
            print("This column is not used by the model. Dropping it...")
            
            # Drop the column
            conn.execute(text("""
                ALTER TABLE alertas 
                DROP COLUMN IF EXISTS fecha
            """))
            conn.commit()
            print("✓ 'fecha' column dropped successfully")
        else:
            print("✓ 'fecha' column doesn't exist (already clean)")
        
        # Show final schema
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'alertas'
            ORDER BY ordinal_position
        """))
        print("\nFinal alertas table schema:")
        for row in result:
            nullable = "NULL" if row[2] == "YES" else "NOT NULL"
            print(f"  - {row[0]}: {row[1]} ({nullable})")

if __name__ == "__main__":
    fix_alertas_fecha_column()
