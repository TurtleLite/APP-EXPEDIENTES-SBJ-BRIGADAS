#!/usr/bin/env python3
"""Respaldo diario de la base de datos (CockroachDB / PostgreSQL) del Sistema de Expedientes.

Uso:
    python backup_db.py                # respaldo completo comprimido (.sql.gz)
    python backup_db.py --keep 14      # conservar los ultimos 14 respaldos (default: 7)

Genera en backend/backups/backup_YYYYMMDD_HHMMSS.sql.gz:
    - Esquema: SHOW CREATE TABLE (CockroachDB) o reconstruccion via information_schema
    - Datos: INSERTs por tabla (escape via psycopg2)

Requiere DATABASE_URL (variable de entorno o backend/.env, formato cockroachdb:// o postgresql://).

Restaurar un respaldo (linux/mac/windows con psql o cockroach):
    gunzip -k backup_20260101_000000.sql.gz
    psql "$DATABASE_URL" -f backup_20260101_000000.sql
"""

import argparse
import gzip
import json
import os
import sys
from datetime import datetime
from pathlib import Path

BACKUP_DIR = Path(__file__).resolve().parent / "backups"

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass

import psycopg2  # noqa: E402
from psycopg2 import sql  # noqa: E402
from psycopg2.extensions import AsIs  # noqa: E402


def adapt_value(v):
    if isinstance(v, (dict, list)):
        escaped = json.dumps(v, ensure_ascii=False).replace("'", "''")
        return AsIs("'%s'::jsonb" % escaped)
    return v


def get_dsn() -> str:
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        print("ERROR: variable DATABASE_URL no encontrada (revisa backend/.env)", file=sys.stderr)
        sys.exit(1)
    if url.startswith("cockroachdb://"):
        url = url.replace("cockroachdb://", "postgresql://", 1)
    elif url.startswith("postgresql+psycopg2://"):
        url = url.replace("postgresql+psycopg2://", "postgresql://", 1)
    return url


def table_names(cur) -> list:
    cur.execute(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
    )
    return [r[0] for r in cur.fetchall()]


def ordered_tables(tables: list) -> list:
    tables.sort(key=lambda t: (t != "users", t))
    return tables


def is_cockroach(cur) -> bool:
    cur.execute("SELECT version()")
    return "CockroachDB" in (cur.fetchone()[0] or "")


def create_statements(cur, tables: list, cockroach: bool) -> dict:
    out = {}
    for t in tables:
        q = sql.Identifier(t)
        if cockroach:
            cur.execute(sql.SQL("SHOW CREATE TABLE {}").format(q))
            out[t] = cur.fetchone()[1]
        else:
            cur.execute(
                "SELECT column_name, data_type, is_nullable, column_default "
                "FROM information_schema.columns WHERE table_name = %s ORDER BY ordinal_position",
                (t,),
            )
            cols = cur.fetchall()
            cur.execute(
                "SELECT kcu.column_name FROM information_schema.table_constraints tc "
                "JOIN information_schema.key_column_usage kcu "
                "ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema "
                "WHERE tc.table_name = %s AND tc.constraint_type = 'PRIMARY KEY' "
                "ORDER BY kcu.ordinal_position",
                (t,),
            )
            pk = [r[0] for r in cur.fetchall()]
            type_map = {
                "character varying": "VARCHAR",
                "text": "TEXT",
                "integer": "INTEGER",
                "bigint": "BIGINT",
                "boolean": "BOOLEAN",
                "date": "DATE",
                "timestamp with time zone": "TIMESTAMPTZ",
                "timestamp without time zone": "TIMESTAMP",
                "jsonb": "JSONB",
                "json": "JSONB",
                "numeric": "NUMERIC",
                "double precision": "DOUBLE PRECISION",
            }
            parts = []
            for name, dtype, nullable, default in cols:
                piece = f"    {name} {type_map.get(dtype, dtype)}"
                if default is not None and "nextval" not in str(default):
                    piece += f" DEFAULT {default}"
                if nullable == "NO":
                    piece += " NOT NULL"
                parts.append(piece)
            if pk:
                parts.append("    PRIMARY KEY (" + ", ".join(pk) + ")")
            out[t] = "CREATE TABLE " + t + " (\n" + ",\n".join(parts) + "\n)"
    return out


def dump_table_data(cur, conn, t: str, gz: gzip.GzipFile, totals: list) -> int:
    cur.execute(sql.SQL("SELECT * FROM {}").format(sql.Identifier(t)))
    cols = [d[0] for d in cur.description]
    placeholders = sql.SQL(", ").join(sql.Placeholder() * len(cols))
    insert = sql.SQL("INSERT INTO {} ({}) VALUES ({});\n").format(
        sql.Identifier(t),
        sql.SQL(", ").join(sql.Identifier(c) for c in cols),
        placeholders,
    )
    count = 0
    while True:
        rows = cur.fetchmany(1000)
        if not rows:
            break
        for row in rows:
            gz.write(cur.mogrify(insert, [adapt_value(v) for v in row]))
        count += len(rows)
    totals.append((t, count))
    return count


def prune(keep: int) -> int:
    backups = sorted(BACKUP_DIR.glob("backup_*.sql.gz"))
    removed = 0
    for old in backups[:-keep] if keep > 0 else backups:
        old.unlink()
        removed += 1
    return removed


def main() -> int:
    ap = argparse.ArgumentParser(description="Respaldo de la base de datos del Sistema de Expedientes")
    ap.add_argument("--keep", type=int, default=7, help="numero de respaldos a conservar (default: 7)")
    args = ap.parse_args()

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest = BACKUP_DIR / ("backup_%s.sql.gz" % stamp)

    conn = None
    try:
        conn = psycopg2.connect(get_dsn())
        cur = conn.cursor()
        cockroach = is_cockroach(cur)
        dbname = conn.info.dbname or "defaultdb"

        tables = ordered_tables(table_names(cur))
        schemas = create_statements(cur, tables, cockroach)

        with gzip.open(dest, "wb") as gz:
            gz.write(("-- Respaldo generado por backup_db.py\n").encode())
            gz.write(("-- Fecha: %s\n" % datetime.now().isoformat(timespec="seconds")).encode())
            gz.write(("-- Base: %s (%s)\n" % (dbname, "CockroachDB" if cockroach else "PostgreSQL")).encode())
            gz.write(("-- Restaurar: gunzip -k %s && psql \"$DATABASE_URL\" -f %s\n"
                      % (dest.name, dest.with_suffix("").name)).encode())
            gz.write(b"\nBEGIN;\n\n")
            for t in tables:
                gz.write(("-- Tabla: %s\n%s;\n\n" % (t, schemas[t].rstrip(";"))).encode())
            gz.write(b"-- Datos\n")
            totals = []
            for t in tables:
                dump_table_data(cur, conn, t, gz, totals)
                gz.write(b"\n")
            gz.write(b"COMMIT;\n")

        size_kb = dest.stat().st_size / 1024
        rows = sum(n for _, n in totals)
        print("Respaldo OK: %s (%d tablas, %d filas, %.1f KB)" % (dest, len(tables), rows, size_kb))
        for t, n in totals:
            print("  - %s: %d filas" % (t, n))
        removed = prune(args.keep)
        if removed:
            print("Eliminados %d respaldo(s) antiguo(s) (se conservan los ultimos %d)" % (removed, args.keep))
        return 0
    except Exception as e:
        print("ERROR en el respaldo: %s" % e, file=sys.stderr)
        if conn is not None:
            conn.rollback()
        return 1
    finally:
        if conn is not None:
            conn.close()


if __name__ == "__main__":
    sys.exit(main())
