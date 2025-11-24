"""
Script to populate test data in SQLite database.
"""
from sqlmodel import Session, select
from app.db.database import engine
from app.models import Estudiante, Grupo, CicloEscolar

def create_test_data():
    with Session(engine) as session:
        # 1. Create Ciclo Escolar
        ciclo = session.exec(select(CicloEscolar).where(CicloEscolar.nombre == "2025-A")).first()
        if not ciclo:
            ciclo = CicloEscolar(nombre="2025-A", activo=True)
            session.add(ciclo)
            session.commit()
            session.refresh(ciclo)
            print(f"✅ Ciclo escolar created: {ciclo.nombre}")
        
        # 2. Create Grupo
        grupo = session.exec(select(Grupo).where(Grupo.nombre == "1-A")).first()
        if not grupo:
            grupo = Grupo(nombre="1-A", semestre=1, turno="matutino")
            session.add(grupo)
            session.commit()
            session.refresh(grupo)
            print(f"✅ Grupo created: {grupo.nombre}")
            
        # 3. Create Estudiante
        matricula = "2025002"
        estudiante = session.get(Estudiante, matricula)
        if not estudiante:
            estudiante = Estudiante(
                matricula=matricula,
                nombre="Juan Carlos",
                apellido="Perez Roldan",
                id_grupo=grupo.id,
                id_ciclo=ciclo.id
            )
            session.add(estudiante)
            session.commit()
            print(f"✅ Estudiante created: {estudiante.nombre} ({estudiante.matricula})")
        else:
            print(f"ℹ️ Estudiante already exists: {estudiante.matricula}")

if __name__ == "__main__":
    create_test_data()
