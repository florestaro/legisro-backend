"""
LegisRO - Banco de dados em memoria (Railway-safe)
Substitui SQLite por armazenamento em memoria para funcionar
corretamente no Railway (filesystem efemero).
"""

from datetime import datetime
from typing import List, Dict, Optional

_LEIS_DB: List[Dict] = []
_ALERTAS_DB: List[Dict] = []


def init_db():
    """No-op: banco em memoria nao precisa de inicializacao."""
    pass


def salvar_leis(leis: List[Dict]):
    """Salva leis na lista em memoria (sem duplicatas)."""
    if not leis:
        return
    slugs_existentes = set(
        l.get("municipio_slug", "") + str(l.get("numero", ""))
        for l in _LEIS_DB
    )
    for lei in leis:
        chave = lei.get("municipio_slug", "") + str(lei.get("numero", ""))
        if chave not in slugs_existentes:
            lei_copy = dict(lei)
            if "data_lei" not in lei_copy and "data" in lei_copy:
                lei_copy["data_lei"] = lei_copy["data"]
            lei_copy.setdefault("criado_em", datetime.now().isoformat())
            _LEIS_DB.append(lei_copy)
            slugs_existentes.add(chave)


def buscar_leis_cache(municipio_slug=None, termo=None, ano=None, limite=500) -> List[Dict]:
    """Retorna todas as leis em memoria (com filtros opcionais)."""
    resultado = _LEIS_DB
    if municipio_slug:
        resultado = [l for l in resultado if l.get("municipio_slug") == municipio_slug]
    if termo:
        t = termo.lower()
        resultado = [l for l in resultado if t in l.get("ementa", "").lower()]
    if ano:
        resultado = [l for l in resultado if l.get("ano") == ano]
    return resultado[:limite]


def buscar_alertas(municipio_slug=None, limite=10) -> List[Dict]:
    """Retorna alertas em memoria."""
    if municipio_slug:
        return [a for a in _ALERTAS_DB if a.get("municipio_slug") == municipio_slug][:limite]
    return _ALERTAS_DB[:limite]


def salvar_alerta(alerta: Dict):
    """Salva alerta na lista em memoria."""
    _ALERTAS_DB.append(alerta)


def get_stats() -> Dict:
    """Retorna estatisticas do banco em memoria."""
    municipios = set(l.get("municipio_slug") for l in _LEIS_DB)
    return {
        "total_leis": len(_LEIS_DB),
        "total_municipios": len(municipios),
        "total_alertas": len(_ALERTAS_DB),
        "municipios_rondonia": 52,
    }
