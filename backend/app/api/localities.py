import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.services.auth_service import require_role

router = APIRouter(prefix="/localities", tags=["Localidades"])


@router.get("/")
def list_localities(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    rows = db.execute(text(
        "SELECT data->>'localidad' AS loc, data->>'tipo_localidad' AS tipo, COUNT(*) AS n "
        "FROM list_records "
        "WHERE data->>'localidad' IS NOT NULL AND data->>'localidad' != '' "
        "GROUP BY loc, tipo ORDER BY loc"
    )).all()
    return [{"name": r[0], "tipo": r[1] or "", "count": r[2]} for r in rows]


@router.put("/rename")
def rename_locality(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    old = (data.get("old") or "").strip()
    new = (data.get("new") or "").strip()
    if not old or not new:
        raise HTTPException(status_code=400, detail="La localidad original y la nueva son obligatorias")
    if old == new:
        return {"message": "Sin cambios", "updated": 0}
    res = db.execute(
        text(
            "UPDATE list_records "
            "SET data = jsonb_set(data, '{localidad}', CAST(:new AS JSONB)), updated_at = now() "
            "WHERE data->>'localidad' = :old"
        ),
        {"old": old, "new": json.dumps(new)},
    )
    db.commit()
    return {"message": f"Localidad renombrada en {res.rowcount} expediente(s)", "updated": res.rowcount}


@router.delete("/")
def delete_locality(
    name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    if not name.strip():
        raise HTTPException(status_code=400, detail="Nombre de localidad inválido")
    res = db.execute(
        text(
            "UPDATE list_records "
            "SET data = (data - 'localidad') - 'tipo_localidad', updated_at = now() "
            "WHERE data->>'localidad' = :name"
        ),
        {"name": name.strip()},
    )
    db.commit()
    return {"message": f"Localidad eliminada de {res.rowcount} expediente(s)", "updated": res.rowcount}
