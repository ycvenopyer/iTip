import os
from pathlib import Path

import psycopg
from psycopg.rows import dict_row


def database():
    url = os.getenv("DATABASE_URL", "").strip()
    if not url.startswith(("postgresql://", "postgres://")):
        raise RuntimeError("Set DATABASE_URL to a PostgreSQL connection URL.")
    return psycopg.connect(url, row_factory=dict_row, connect_timeout=8, prepare_threshold=None)


def query(connection, sql, **params):
    return connection.execute(sql, params or None)


def init_schema():
    schema = (Path(__file__).parent / "schema.sql").read_text(encoding="utf-8")
    with database() as connection:
        connection.execute(schema)
