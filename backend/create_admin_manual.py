import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlmodel import Session, text
from app.db.database import engine
from app.core.security import get_password_hash

def create_admin():
    print(f"Checking database at: {engine.url}")
    
    try:
        with Session(engine) as session:
            print("Connecting to database...")
            # Use raw SQL to avoid mapper issues
            result = session.exec(text("SELECT id, username, role FROM usuarios WHERE username = 'admin'"))
            admin = result.first()
            
            if admin:
                print("✅ Admin user ALREADY EXISTS.")
                print(f"   ID: {admin[0]}")
                print(f"   Username: {admin[1]}")
                print(f"   Role: {admin[2]}")
            else:
                print("⚠️  Admin user NOT FOUND. Creating it now...")
                # We need to insert manually or try to use the model carefully
                # Let's try raw insert to be safe from ORM issues
                hashed_pwd = get_password_hash("admin123")
                # Note: permissions is a JSON field, we need to pass it as string
                query = text("""
                INSERT INTO usuarios (username, hashed_password, full_name, role, permissions)
                VALUES (:username, :password, :fullname, :role, :permissions)
                """)
                session.exec(query, params={
                    "username": "admin",
                    "password": hashed_pwd,
                    "fullname": "Administrador Sistema",
                    "role": "Admin",
                    "permissions": '{"all": true}'
                })
                session.commit()
                print("✅ Admin user CREATED SUCCESSFULLY via raw SQL.")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    create_admin()
