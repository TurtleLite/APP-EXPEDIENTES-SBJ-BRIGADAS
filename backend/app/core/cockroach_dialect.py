from sqlalchemy.dialects.postgresql.psycopg2 import PGDialect_psycopg2
import re


class CockroachDialect(PGDialect_psycopg2):
    supports_statement_cache = True

    def _get_server_version_info(self, connection):
        v = connection.exec_driver_sql("SELECT version()").scalar()
        match = re.search(r"v(\d+)\.(\d+)", v)
        if match:
            return int(match.group(1)), int(match.group(2))
        return (26, 0)
