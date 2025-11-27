# Script to fix Alertas table schema
# Adds ALL missing columns to match the model definition

from sqlalchemy import create_engine, text
from app.core.config import settings

def fix_alertas_schema():
    """Add all missing columns to alertas table"""
    engine = create_engine(str(settings.DATABASE_URL))
    
    with engine.connect() as conn:
        # Check if columns exist
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'alertas'
        """))
        existing_columns = [row[0] for row in result]
        
        print(f"Existing columns in alertas table: {existing_columns}")
        
        # Define all required columns with their SQL definitions
        required_columns = {
            'fecha_creacion': 'DATE DEFAULT CURRENT_DATE',
            'fecha_modificacion': 'TIMESTAMP',
            'cantidad_faltas': 'INTEGER DEFAULT 0',
            'justificacion': 'TEXT',
            'fecha_justificacion': 'DATE'
        }
        
        # Add each missing column
        for column_name, column_def in required_columns.items():
            if column_name not in existing_columns:
                print(f"Adding {column_name} column...")
                conn.execute(text(f"""
                    ALTER TABLE alertas 
                    ADD COLUMN {column_name} {column_def}
                """))
                conn.commit()
                print(f"✓ {column_name} column added")
            else:
                print(f"✓ {column_name} column already exists")
        
        print("\n✅ Alertas table schema fixed successfully!")
        
        # Show final schema
        result = conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'alertas'
            ORDER BY ordinal_position
        """))
        print("\nFinal alertas table schema:")
        for row in result:
            print(f"  - {row[0]}: {row[1]}")

if __name__ == "__main__":
    fix_alertas_schema()
