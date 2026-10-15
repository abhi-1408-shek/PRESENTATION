"""Small persistence layer for the seminar estimator.

Uses Render PostgreSQL when DATABASE_URL is configured and a local SQLite file
for development. Keeping this module dependency-light makes the demo easy to
deploy while ensuring every web worker reads the same enrolled profile.
"""

from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator


class ProfileStore:
    def __init__(self, database_url: str | None = None) -> None:
        self.database_url = (database_url or os.environ.get("DATABASE_URL") or "").strip()
        self.is_postgres = self.database_url.startswith(("postgres://", "postgresql://"))
        if not self.database_url:
            local_path = Path(__file__).resolve().parent / "instance" / "estimator.db"
            local_path.parent.mkdir(parents=True, exist_ok=True)
            self.database_url = f"sqlite:///{local_path}"

    @contextmanager
    def connection(self) -> Iterator[Any]:
        if self.is_postgres:
            import psycopg

            with psycopg.connect(self.database_url) as conn:
                yield conn
        else:
            path = self.database_url.removeprefix("sqlite:///")
            with sqlite3.connect(path) as conn:
                yield conn

    def _sql(self, statement: str) -> str:
        return statement.replace("?", "%s") if self.is_postgres else statement

    def initialize(self) -> None:
        with self.connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS enrollment_profile (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    samples_json TEXT NOT NULL,
                    admin_ip_hmac TEXT,
                    version INTEGER NOT NULL,
                    trained_at TEXT,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )

    def load(self) -> dict[str, Any] | None:
        with self.connection() as conn:
            row = conn.execute(
                "SELECT samples_json, admin_ip_hmac, version, trained_at, updated_at "
                "FROM enrollment_profile WHERE id = 1"
            ).fetchone()
        if row is None:
            return None
        return {
            "samples": json.loads(row[0]),
            "admin_ip_hmac": row[1],
            "version": int(row[2]),
            "trained_at": row[3],
            "updated_at": row[4],
        }

    def save(
        self,
        samples: list[list[list[float]]],
        admin_ip_hmac: str,
        version: int,
        trained_at: str | None,
    ) -> None:
        with self.connection() as conn:
            conn.execute(
                self._sql(
                    """
                    INSERT INTO enrollment_profile
                        (id, samples_json, admin_ip_hmac, version, trained_at, updated_at)
                    VALUES (1, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(id) DO UPDATE SET
                        samples_json = excluded.samples_json,
                        admin_ip_hmac = excluded.admin_ip_hmac,
                        version = excluded.version,
                        trained_at = excluded.trained_at,
                        updated_at = CURRENT_TIMESTAMP
                    """
                ),
                (json.dumps(samples), admin_ip_hmac, version, trained_at),
            )

    def clear(self) -> None:
        with self.connection() as conn:
            conn.execute("DELETE FROM enrollment_profile WHERE id = 1")
