"""
LegisRO - Banco de dados SQLite
Cache local de leis para buscas rapidas e funcionamento offline.
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "legisro.db"


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Cria as tabelas se nao existirem."""
    conn = get_conn()
    c = conn.cursor()

    c.executescript("""
        CREATE TABLE IF NOT EXISTS leis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            municipio_slug TEXT NOT NULL,
            municipio_nome TEXT NOT NULL,
            tipo TEXT,
            numero TEXT,
            ano INTEGER,
            ementa TEXT,
            data_lei TEXT,
            url_oficial TEXT,
            fonte TEXT DEFAULT 'SAPL',
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(municipio_slug, tipo, numero, ano)
        );

        CREATE TABLE IF NOT EXISTS materias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            municipio_slug TEXT NOT NULL,
            municipio_nome TEXT NOT NULL,
            tipo TEXT,
            numero TEXT,
            ano INTEGER,
            ementa TEXT,
            data_apresentacao TEXT,
            em_tramitacao INTEGER DEFAULT 0,
            url_oficial TEXT,
            criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(municipio_slug, tipo, numero, ano)
        );

        CREATE TABLE IF NOT EXISTS alertas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            municipio_slug TEXT NOT NULL,
            municipio_nome TEXT NOT NULL,
            titulo TEXT NOT NULL,
            descricao TEXT,
            categoria TEXT,
            url_oficial TEXT,
            data_alerta TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS cache_stats (
            municipio_slug TEXT PRIMARY KEY,
            total_leis INTEGER DEFAULT 0,
            ultima_atualizacao TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_leis_municipio ON leis(municipio_slug);
        CREATE INDEX IF NOT EXISTS idx_leis_ementa ON leis(ementa);
        CREATE INDEX IF NOT EXISTS idx_materias_municipio ON materias(municipio_slug);
        CREATE INDEX IF NOT EXISTS idx_alertas_municipio ON alertas(municipio_slug);
    """)

    conn.commit()
    conn.close()


def salvar_leis(leis):
    """Salva lista de leis no banco de dados."""
    if not leis:
        return
    conn = get_conn()
    c = conn.cursor()
    for lei in leis:
        try:
            c.execute("""
                INSERT OR REPLACE INTO leis
                    (municipio_slug, municipio_nome, tipo, numero, ano, ementa, data_lei, url_oficial, fonte)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                lei.get("municipio_slug", ""),
                lei.get("municipio", ""),
                lei.get("tipo", ""),
                str(lei.get("numero", "")),
                lei.get("ano"),
                lei.get("ementa", ""),
                lei.get("data", ""),
                lei.get("url_oficial", ""),
                lei.get("fonte", "SAPL"),
            ))
        except Exception:
            pass
    conn.commit()

    if leis:
        slug = leis[0].get("municipio_slug", "")
        total = c.execute("SELECT COUNT(*) FROM leis WHERE municipio_slug=?", (slug,)).fetchone()[0]
        c.execute("""
            INSERT OR REPLACE INTO cache_stats (municipio_slug, total_leis, ultima_atualizacao)
            VALUES (?, ?, ?)
        """, (slug, total, datetime.now().isoformat()))
        conn.commit()

    conn.close()


def buscar_leis_cache(municipio_slug=None, termo=None, ano=None, limite=20):
    """Busca leis no cache local."""
    conn = get_conn()
    c = conn.cursor()

    query = "SELECT * FROM leis WHERE 1=1"
    params = []

    if municipio_slug:
        query += " AND municipio_slug = ?"
        params.append(municipio_slug)
    if termo:
        query += " AND ementa LIKE ?"
        params.append(f"%{termo}%")
    if ano:
        query += " AND ano = ?"
        params.append(ano)

    query += " ORDER BY ano DESC, id DESC LIMIT ?"
    params.append(limite)

    rows = c.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def buscar_alertas(municipio_slug=None, limite=10):
    """Retorna alertas recentes."""
    conn = get_conn()
    c = conn.cursor()
    if municipio_slug:
        rows = c.execute(
            "SELECT * FROM alertas WHERE municipio_slug=? ORDER BY data_alerta DESC LIMIT ?",
            (municipio_slug, limite)
        ).fetchall()
    else:
        rows = c.execute(
            "SELECT * FROM alertas ORDER BY data_alerta DESC LIMIT ?",
            (limite,)
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def salvar_alerta(alerta):
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        INSERT INTO alertas (municipio_slug, municipio_nome, titulo, descricao, categoria, url_oficial, data_alerta)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        alerta.get("municipio_slug", ""),
        alerta.get("municipio", ""),
        alerta.get("titulo", ""),
        alerta.get("descricao", ""),
        alerta.get("categoria", ""),
        alerta.get("url_oficial", ""),
        alerta.get("data", datetime.now().isoformat()),
    ))
    conn.commit()
    conn.close()


def get_stats():
    """Retorna estatisticas reais do banco."""
    conn = get_conn()
    c = conn.cursor()
    total_leis = c.execute("SELECT COUNT(*) FROM leis").fetchone()[0]
    total_municipios = c.execute("SELECT COUNT(DISTINCT municipio_slug) FROM leis").fetchone()[0]
    total_alertas = c.execute("SELECT COUNT(*) FROM alertas").fetchone()[0]
    conn.close()
    return {
        "total_leis": total_leis,
        "total_municipios": total_municipios,
        "total_alertas": total_alertas,
        "municipios_rondonia": 52,
    }
