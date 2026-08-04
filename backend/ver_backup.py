#!/usr/bin/env python3
"""Ver el contenido de un respaldo backup_*.sql.gz sin restaurar la BD.

Uso:
    python3 ver_backup.py                          # lista las tablas con su conteo
    python3 ver_backup.py <archivo.sql.gz>         # muestra todas las tablas
    python3 ver_backup.py <archivo.sql.gz> users   # muestra solo una tabla
    python3 ver_backup.py <archivo.sql.gz> users --csv   # salida CSV (para Excel)
"""

import gzip
import re
import sys
from pathlib import Path

BACKUP_DIR = Path(__file__).resolve().parent / "backups"


def latest():
    files = sorted(BACKUP_DIR.glob("backup_*.sql.gz"))
    return files[-1] if files else None


def split_values(values):
    parts, cur, depth, quote = [], '', 0, False
    i = 0
    while i < len(values):
        c = values[i]
        if quote:
            cur += c
            if c == "'":
                if i + 1 < len(values) and values[i + 1] == "'":
                    cur += values[i + 1]
                    i += 1
                else:
                    quote = False
            i += 1
            continue
        if c == "'":
            quote = True
            cur += c
        elif c == '(':
            depth += 1
            cur += c
        elif c == ')':
            depth -= 1
            cur += c
        elif c == ',' and depth == 0:
            parts.append(cur)
            cur = ''
        else:
            cur += c
        i += 1
    if cur:
        parts.append(cur)
    return parts


def clean(v):
    v = re.sub(r"::(jsonb|INT8|VARCHAR|BOOL|TIMESTAMPTZ|INT)\b.*$", "", v).strip()
    if v == "NULL":
        return ""
    if v.startswith("'") and v.endswith("'"):
        return v[1:-1].replace("''", "'")
    return v


def main():
    path = None
    table_filter = None
    csv = False
    args = [a for a in sys.argv[1:]]
    if "--csv" in args:
        csv = True
        args.remove("--csv")
    if args:
        path = Path(args[0])
        if not path.exists():
            path = BACKUP_DIR / args[0]
    if len(args) > 1:
        table_filter = args[1]
    if not path or not path.exists():
        path = latest()
        if not path:
            print("No hay respaldos en %s" % BACKUP_DIR)
            sys.exit(1)
        print("Usando el respaldo mas reciente: %s\n" % path.name)

    inserts = {}
    order = []
    with gzip.open(path, "rt", encoding="utf-8") as f:
        for line in f:
            m = re.match(r'INSERT INTO public\.(\w+) \((.*?)\) VALUES \((.*)\);\s*$', line.rstrip("\n"))
            if m:
                t, cols, vals = m.group(1), m.group(2), m.group(3)
                if t not in inserts:
                    inserts[t] = []
                    order.append(t)
                inserts[t].append((cols.split(", "), split_values(vals)))

    if table_filter:
        if table_filter not in inserts:
            print("Tabla '%s' no existe. Tablas: %s" % (table_filter, ", ".join(order)))
            sys.exit(1)
        order = [table_filter]

    for t in order:
        rows = inserts[t]
        print("=" * 70)
        print("Tabla %s (%d filas)" % (t, len(rows)))
        print("=" * 70)
        if not rows:
            print("(sin datos)")
            print()
            continue
        cols = rows[0][0]
        data = [[clean(v) for v in vals] for _, vals in rows]
        if csv:
            print(",".join(cols))
            for row in data:
                print(",".join('"%s"' % v.replace('"', '""') for v in row))
        else:
            widths = [max(len(c), *(len(r[i]) for r in data)) for i, c in enumerate(cols)]
            print("  ".join(c.ljust(widths[i]) for i, c in enumerate(cols)))
            print("  ".join("-" * w for w in widths))
            for row in data:
                print("  ".join(v.ljust(widths[i]) for i, v in enumerate(row)))
        print()


if __name__ == "__main__":
    main()
