"""
LegisRO - Banco de dados em memoria (Railway-safe)
NormStr + LeiProxy: busca insensivel a acentos sem alterar main.py.
"""

import unicodedata
from datetime import datetime

_LEIS_DB = []
_ALERTAS_DB = []


def _fix_enc(s):
    """Corrige double-encoding UTF-8 (artefato de injecao via base64/atob)."""
    if not s or not isinstance(s, str):
        return s or ""
    try:
        return s.encode('latin-1').decode('utf-8')
    except Exception:
        return s


class NormStr(str):
    """String que normaliza acentos em .lower() e 'in' para busca robusta."""
    @staticmethod
    def _n(s):
        return unicodedata.normalize('NFD', str(s) or '').encode('ascii', 'ignore').decode('ascii').lower()

    def lower(self):
        # Retorna NormStr normalizada para que 'in' tambem seja normalizado
        return NormStr(NormStr._n(self))

    def __contains__(self, item):
        return NormStr._n(item) in NormStr._n(self)


class LeiProxy(dict):
    """Dict de lei: get('ementa') retorna NormStr para busca sem acento."""
    def get(self, key, default=None):
        val = super().get(key, default)
        if key == 'ementa' and isinstance(val, str):
            return NormStr(val)
        return val


def init_db():
    pass


def salvar_leis(leis):
    if not leis:
        return
    slugs = set(l.get("municipio_slug", "") + str(l.get("numero", "")) for l in _LEIS_DB)
    for lei in leis:
        k = lei.get("municipio_slug", "") + str(lei.get("numero", ""))
        if k not in slugs:
            c = dict(lei)
            for f in ("ementa", "municipio", "tipo", "municipio_nome"):
                if f in c:
                    c[f] = _fix_enc(c[f])
            if "data_lei" not in c and "data" in c:
                c["data_lei"] = c["data"]
            c.setdefault("criado_em", datetime.now().isoformat())
            _LEIS_DB.append(c)
            slugs.add(k)


def buscar_leis_cache(municipio_slug=None, termo=None, ano=None, limite=500):
    resultado = list(_LEIS_DB)
    if municipio_slug:
        resultado = [l for l in resultado if l.get("municipio_slug") == municipio_slug]
    if termo:
        t = NormStr._n(termo)
        resultado = [l for l in resultado if t in NormStr._n(l.get("ementa", ""))]
    if ano:
        resultado = [l for l in resultado if l.get("ano") == ano]
    # Retorna LeiProxy para que main.py possa buscar sem acentos via .get()
    return [LeiProxy(l) for l in resultado[:limite]]


def buscar_alertas(municipio_slug=None, limite=10):
    if municipio_slug:
        return [a for a in _ALERTAS_DB if a.get("municipio_slug") == municipio_slug][:limite]
    return _ALERTAS_DB[:limite]


def salvar_alerta(alerta):
    _ALERTAS_DB.append(alerta)


def get_stats():
    munis = set(l.get("municipio_slug") for l in _LEIS_DB)
    return {"total_leis": len(_LEIS_DB), "total_municipios": len(munis),
            "total_alertas": len(_ALERTAS_DB), "municipios_rondonia": 52}
