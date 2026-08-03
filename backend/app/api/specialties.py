import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.services.auth_service import require_role

router = APIRouter(prefix="/specialties", tags=["Especialidades"])


@router.get("/")
def list_specialties(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    rows = db.execute(text(
        "SELECT data->>'especialidad' AS esp, COUNT(*) AS n "
        "FROM list_records "
        "WHERE data->>'especialidad' IS NOT NULL AND data->>'especialidad' != '' "
        "GROUP BY esp ORDER BY esp"
    )).all()
    return [{"name": r[0], "count": r[1]} for r in rows]


@router.put("/rename")
def rename_specialty(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    old = (data.get("old") or "").strip()
    new = (data.get("new") or "").strip()
    if not old or not new:
        raise HTTPException(status_code=400, detail="La especialidad original y la nueva son obligatorias")
    if old == new:
        return {"message": "Sin cambios", "updated": 0}
    res = db.execute(
        text(
            "UPDATE list_records "
            "SET data = jsonb_set(data, '{especialidad}', CAST(:new AS JSONB)), updated_at = now() "
            "WHERE data->>'especialidad' = :old"
        ),
        {"old": old, "new": json.dumps(new)},
    )
    db.commit()
    return {"message": f"Especialidad renombrada en {res.rowcount} expediente(s)", "updated": res.rowcount}


@router.delete("/")
def delete_specialty(
    name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    if not name.strip():
        raise HTTPException(status_code=400, detail="Nombre de especialidad inválido")
    res = db.execute(
        text(
            "UPDATE list_records "
            "SET data = data - 'especialidad', updated_at = now() "
            "WHERE data->>'especialidad' = :name"
        ),
        {"name": name.strip()},
    )
    db.commit()
    return {"message": f"Especialidad eliminada de {res.rowcount} expediente(s)", "updated": res.rowcount}
