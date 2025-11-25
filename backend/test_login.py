import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlmodel import Session, select
from app.db.database import engine
from app.models import Usuario
from app.core.security import verify_password

def test_login():
    print("Testing login credentials...")
    
    try:
        with Session(engine) as session:
            # Get admin user
            admin = session.exec(select(Usuario).where(Usuario.username == "admin")).first()
            
            if not admin:
                print("❌ Admin user NOT FOUND in database")
                return
            
            print(f"✅ Admin user found:")
            print(f"   ID: {admin.id}")
            print(f"   Username: {admin.username}")
            print(f"   Full Name: {admin.full_name}")
            print(f"   Role: {admin.role}")
            print(f"   Hashed Password (first 50 chars): {admin.hashed_password[:50]}...")
            
            # Test password
            test_password = "admin123"
            is_valid = verify_password(test_password, admin.hashed_password)
            
            if is_valid:
                print(f"\n✅ Password '{test_password}' is CORRECT!")
            else:
                print(f"\n❌ Password '{test_password}' is INCORRECT!")
                
                # Try to verify what the issue might be
                print("\nDebugging info:")
                print(f"   Password length: {len(test_password)}")
                print(f"   Hash length: {len(admin.hashed_password)}")
                print(f"   Hash starts with: {admin.hashed_password[:10]}")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_login()
