import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.catalog_item import CatalogItem
from app.models.user import User
from app.services.auth_service import require_role

TIPO_LOCALIDAD_OPTIONS = ["Aldea", "Barrio", "Colonia", "Caserio"]

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
        "GROUP BY loc, tipo"
    )).all()
    merged = {}
    for loc, tipo, n in rows:
        merged.setdefault(loc, {"tipo": tipo or "", "count": 0})
        merged[loc]["count"] += n
    for item in db.query(CatalogItem).filter(CatalogItem.item_type == "localidad"):
        merged.setdefault(item.name, {"tipo": item.locality_type or "", "count": 0})
    return [{"name": name, "tipo": info["tipo"], "count": info["count"]} for name, info in sorted(merged.items())]


@router.post("/")
def create_locality(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    name = (data.get("name") or "").strip()
    tipo = (data.get("tipo") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="El nombre de la localidad es obligatorio")
    if len(name) > 150:
        raise HTTPException(status_code=400, detail="El nombre no puede superar 150 caracteres")
    if tipo and tipo not in TIPO_LOCALIDAD_OPTIONS:
        raise HTTPException(status_code=400, detail=f"Tipo de localidad inválido. Válidos: {', '.join(TIPO_LOCALIDAD_OPTIONS)}")
    existing = db.query(CatalogItem).filter(
        CatalogItem.item_type == "localidad",
        CatalogItem.name == name,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="La localidad ya existe en el catálogo")
    item = CatalogItem(item_type="localidad", name=name, locality_type=tipo or None)
    db.add(item)
    db.commit()
    return {"message": f"Localidad '{name}' creada correctamente", "id": item.id}


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
    catalog = db.query(CatalogItem).filter(
        CatalogItem.item_type == "localidad",
        CatalogItem.name == old,
    ).first()
    if catalog:
        catalog.name = new
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
    db.query(CatalogItem).filter(
        CatalogItem.item_type == "localidad",
        CatalogItem.name == name.strip(),
    ).delete()
    db.commit()
    return {"message": f"Localidad eliminada de {res.rowcount} expediente(s)", "updated": res.rowcount}
