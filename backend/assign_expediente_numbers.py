#!/usr/bin/env python3
"""Renumera los expedientes existentes (00001, 00002, ...) y deja la secuencia lista.

Uso:
    python assign_expediente_numbers.py
"""

import sys
from app.core.database import SessionLocal
from app.services.record_service import renumber_expedientes

if __name__ == "__main__":
    db = SessionLocal()
    try:
        count = renumber_expedientes(db)
        print(f"Renumerados {count} expedientes (00001 - {count:05d}). Siguiente numero: {count + 1:05d}")
    except Exception as e:
        print("ERROR: %s" % e, file=sys.stderr)
        db.rollback()
        sys.exit(1)
    finally:
        db.close()
