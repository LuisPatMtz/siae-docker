import sys
import os

# Add backend directory to path BEFORE importing app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from datetime import datetime
from sqlmodel import Session, select
from app.db.database import engine
from app.models import Estudiante, Asistencia, NFC
from app.api.v1.asistencia_routes import registrar_asistencia

def reproduce():
    with Session(engine) as session:
        # 1. Ensure we have a student and NFC
        matricula = "2025002"
        estudiante = session.get(Estudiante, matricula)
        if not estudiante:
            print(f"Estudiante {matricula} not found. Creating...")
            # Create dummy student if needed, but assuming it exists from previous context
            return

        print(f"Testing attendance registration for {matricula}...")
        
        try:
            # Call the function directly
            result = registrar_asistencia(matricula, session)
            print("Success:", result)
        except Exception as e:
            print("Caught exception:")
            print(e)
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    reproduce()
