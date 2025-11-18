# app/api/v1/estudiantes.py
import csv
import io

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from app.db.database import get_session
from app.core.permissions import get_current_user
from app.models import ( 
    Estudiante, 
    EstudianteCreate, 
    EstudianteRead, 
    EstudianteUpdate,
    EstudianteReadComplete,
    Grupo,
    CicloEscolar,
    NFC,
    EstudianteBulkMoveGrupo
)
from app.repositories.estudiante_repo import EstudianteRepository

router = APIRouter(
    prefix="/estudiantes",
    tags=["Estudiantes"],
    dependencies=[Depends(get_current_user)]
)

@router.post("", response_model=EstudianteRead, status_code=status.HTTP_201_CREATED)
def create_estudiante(
    *, 
    session: Session = Depends(get_session), 
    estudiante: EstudianteCreate
):
    """
    Crea un nuevo estudiante en la base de datos.
    """
    repo = EstudianteRepository(session)
    
    # Verificar si la matrícula ya existe
    if repo.exists(estudiante.matricula):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La matrícula '{estudiante.matricula}' ya está registrada."
        )
    
    # Verificar que el grupo existe si se especifica
    if estudiante.id_grupo:
        grupo = session.get(Grupo, estudiante.id_grupo)
        if not grupo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"El grupo con ID {estudiante.id_grupo} no existe."
            )
    
    # Verificar que el ciclo existe si se especifica
    if estudiante.id_ciclo:
        ciclo = session.get(CicloEscolar, estudiante.id_ciclo)
        if not ciclo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"El ciclo escolar con ID {estudiante.id_ciclo} no existe."
            )
    
    return repo.create(estudiante)

@router.get("", response_model=List[EstudianteReadComplete])
def get_todos_los_estudiantes(
    *,
    session: Session = Depends(get_session)
):
    """
    Obtiene todos los estudiantes con sus relaciones (grupo, ciclo, nfc).
    """
    repo = EstudianteRepository(session)
    return repo.get_all_complete()

@router.get("/grupo/{id_grupo}", response_model=List[EstudianteReadComplete])
def get_estudiantes_por_grupo(
    *,
    session: Session = Depends(get_session),
    id_grupo: int
):
    """
    Obtiene todos los estudiantes de un grupo específico.
    """
    # Verificar que el grupo existe
    grupo = session.get(Grupo, id_grupo)
    if not grupo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El grupo con ID {id_grupo} no existe."
        )
    
    repo = EstudianteRepository(session)
    return repo.get_by_grupo(id_grupo)

@router.get("/ciclo/{id_ciclo}", response_model=List[EstudianteReadComplete])
def get_estudiantes_por_ciclo(
    *,
    session: Session = Depends(get_session),
    id_ciclo: int
):
    """
    Obtiene todos los estudiantes de un ciclo escolar específico.
    """
    # Verificar que el ciclo existe
    ciclo = session.get(CicloEscolar, id_ciclo)
    if not ciclo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El ciclo escolar con ID {id_ciclo} no existe."
        )
    
    repo = EstudianteRepository(session)
    return repo.get_by_ciclo(id_ciclo)

@router.get("/{matricula}", response_model=EstudianteReadComplete)
def get_estudiante_por_matricula(
    *,
    session: Session = Depends(get_session),
    matricula: str
):
    """
    Obtiene un estudiante específico por su matrícula.
    """
    repo = EstudianteRepository(session)
    db_estudiante = repo.get_by_matricula(matricula)

    if not db_estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante con matrícula '{matricula}' no encontrado."
        )
    
    return db_estudiante

@router.put("/{matricula}", response_model=EstudianteRead)
def update_estudiante(
    *,
    session: Session = Depends(get_session),
    matricula: str,
    estudiante_update: EstudianteUpdate
):
    """
    Actualiza un estudiante existente.
    """
    repo = EstudianteRepository(session)
    
    if not repo.exists(matricula):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante con matrícula '{matricula}' no encontrado."
        )
    
    # Verificar que el grupo existe si se está actualizando
    if estudiante_update.id_grupo is not None:
        grupo = session.get(Grupo, estudiante_update.id_grupo)
        if not grupo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"El grupo con ID {estudiante_update.id_grupo} no existe."
            )
    
    # Verificar que el ciclo existe si se está actualizando
    if estudiante_update.id_ciclo is not None:
        ciclo = session.get(CicloEscolar, estudiante_update.id_ciclo)
        if not ciclo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"El ciclo escolar con ID {estudiante_update.id_ciclo} no existe."
            )
    
    return repo.update(matricula, estudiante_update)

@router.post("/upload-csv", summary="Cargar estudiantes desde un CSV")
async def upload_estudiantes_csv(
    *,
    session: Session = Depends(get_session),
    file: UploadFile = File(...)
):
    """
    Carga masiva de estudiantes desde un archivo CSV.
    Valida el archivo completo antes de guardar. Si una fila falla, todo falla.
    """
    
    # 1. Validar tipo de archivo
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="El archivo debe tener extensión .csv"
        )
    
    # 2. Leer y decodificar el archivo
    try:
        contents = await file.read()
        file_str = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(file_str))
        
        filas = list(csv_reader)
        if not filas:
            raise HTTPException(status_code=400, detail="El CSV está vacío.")
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Error al leer o decodificar el CSV: {e}"
        )

    # 3. Validar los datos (Fase de Validación)
    
    # Cargar IDs existentes para validación rápida y eficiente
    repo = EstudianteRepository(session)
    matriculas_existentes = set(session.exec(select(Estudiante.matricula)).all())
    grupos_existentes = set(session.exec(select(Grupo.id)).all())
    ciclos_existentes = set(session.exec(select(CicloEscolar.id)).all())

    estudiantes_a_crear = []
    errores_validacion = []

    for i, row in enumerate(filas):
        row_num = i + 2 # (i+1 por el índice base 0, +1 por la cabecera)
        
        try:
            # 3.1. Validar formato con el DTO
            estudiante_data = EstudianteCreate(**row)
            
            # 3.2. Validar lógica de negocio (duplicados y FKs)
            if estudiante_data.matricula in matriculas_existentes:
                errores_validacion.append(f"Fila {row_num}: Matrícula '{estudiante_data.matricula}' ya existe.")
            
            if estudiante_data.id_grupo and estudiante_data.id_grupo not in grupos_existentes:
                errores_validacion.append(f"Fila {row_num}: Grupo ID '{estudiante_data.id_grupo}' no existe.")
            
            if estudiante_data.id_ciclo and estudiante_data.id_ciclo not in ciclos_existentes:
                 errores_validacion.append(f"Fila {row_num}: Ciclo ID '{estudiante_data.id_ciclo}' no existe.")
            
            # Si pasa, se añade a la lista de creación
            if not errores_validacion:
                db_estudiante = Estudiante.model_validate(estudiante_data)
                estudiantes_a_crear.append(db_estudiante)
                matriculas_existentes.add(db_estudiante.matricula) # Evitar duplicados en el mismo CSV

        except Exception as e: # Error de validación de Pydantic (ej. email inválido)
            errores_validacion.append(f"Fila {row_num}: Error de formato. {str(e)}")

    # 4. Decidir si cometer la transacción
    if errores_validacion:
        # Si hay CUALQUIER error, rechazar todo el archivo
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail={"message": "Errores de validación en el CSV. No se guardó ningún dato.", "errors": errores_validacion}
        )

    # 5. Guardar en DB (Fase de Carga)
    try:
        session.add_all(estudiantes_a_crear)
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error al guardar en la base de datos: {str(e)}"
        )
    
    return {"status": "success", "agregados": len(estudiantes_a_crear)}


@router.patch("/bulk-move-group", summary="Mover varios estudiantes a un nuevo grupo")
def move_estudiantes_de_grupo(
    *,
    session: Session = Depends(get_session),
    payload: EstudianteBulkMoveGrupo
):
    """
    Actualiza el grupo de una lista de estudiantes en una sola transacción.
    """
    
    # 1. Validar que el grupo de destino existe
    grupo_destino = session.get(Grupo, payload.nuevo_id_grupo)
    if not grupo_destino:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El grupo de destino con ID {payload.nuevo_id_grupo} no existe."
        )
        
    # 2. Validar que la lista no esté vacía
    if not payload.matriculas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La lista de matrículas no puede estar vacía."
        )

    # 3. Ejecutar la actualización masiva usando el repositorio
    repo = EstudianteRepository(session)
    try:
        rowcount = repo.bulk_move_grupo(payload.matriculas, payload.nuevo_id_grupo)
        
        return {
            "mensaje": "Estudiantes movidos exitosamente.",
            "estudiantes_afectados": rowcount,
            "id_grupo_destino": payload.nuevo_id_grupo
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al mover estudiantes: {str(e)}"
        )

@router.delete("/{matricula}", status_code=status.HTTP_204_NO_CONTENT)
def delete_estudiante(
    *,
    session: Session = Depends(get_session),
    matricula: str
):
    """
    Elimina un estudiante.
    """
    repo = EstudianteRepository(session)
    
    if not repo.delete(matricula):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante con matrícula '{matricula}' no encontrado."
        )
    
    return None