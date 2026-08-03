"""Índices para escala: aceleran búsquedas y filtros sobre campos JSON de list_records."""
import logging
from sqlalchemy import text

logger = logging.getLogger(__name__)

EXPRESSION_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_list_records_esp ON list_records ((data->>'especialidad'))",
    "CREATE INDEX IF NOT EXISTS idx_list_records_estatus ON list_records ((data->>'estatus_cirugia'))",
    "CREATE INDEX IF NOT EXISTS idx_list_records_nombre ON list_records ((data->>'nombre'))",
    "CREATE INDEX IF NOT EXISTS idx_list_records_apellido ON list_records ((data->>'apellido'))",
    "CREATE INDEX IF NOT EXISTS idx_list_records_identidad ON list_records ((data->>'identidad'))",
    "CREATE INDEX IF NOT EXISTS idx_list_records_expediente ON list_records ((data->>'expediente'))",
    "CREATE INDEX IF NOT EXISTS idx_list_records_list_id ON list_records (list_definition_id, id DESC)",
]

INVERTED_INDEXES = [
    "CREATE INVERTED INDEX IF NOT EXISTS idx_list_records_data ON list_records (data)",
]


def ensure_performance_indexes(engine) -> None:
    with engine.begin() as conn:
        for sql in EXPRESSION_INDEXES + INVERTED_INDEXES:
            try:
                conn.execute(text(sql))
                logger.info(f"Índice listo: {sql.split(' ON ')[1]}")
            except Exception as e:
                logger.warning(f"No se pudo crear índice ({sql[:60]}...): {e}")