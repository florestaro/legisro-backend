"""
LegisRO - Banco de dados em memoria (Railway-safe)
Fix de encoding UTF-8 para dados injetados via base64/atob.
"""

import unicodedata
from datetime import datetime

_LEIS_DB = []
_ALERTAS_DB = []


def _fix_enc(s):
    if not s or not isinstance(s, str):
        return s or ""
    try:
        return s.encode('latin-1').decode('utf-8')
    except Exception:
        return s


def _norm(s):
    s = _fix_enc(s or "")
    return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('ascii').lower()


def init_db():
    pass


def salvar_leis(leis):
    if not leis:
        return
    slugs = set(l.get("municipio_slug","") + str(l.get("numero","")) for l in _LEIS_DB)
    for lei in leis:
        k = lei.get("municipio_slug","") + str(lei.get("numero",""))
        if k not in slugs:
            c = dict(lei)
            for f in ("ementa","municipio","tipo","municipio_nome"):
                if f in c:
                    c[f] = _fix_enc(c[f])
            if "data_lei" not in c and "data" in c:
                c["data_lei"] = c["data"]
            c.setdefault("criado_em", datetime.now().isoformat())
            _LEIS_DB.append(c)
            slugs.add(k)


def buscar_leis_cache(municipio_slug=None, termo=None, ano=None, limite=500):
    r = list(_LEIS_DB)
    if municipio_slug:
        r = [l for l in r if l.get("municipio_slug") == municipio_slug]
    if termo:
        t = _norm(termo)
        r = [l for l in r if t in _norm(l.get("ementa",""))]
    if ano:
        r = [l for l in r if l.get("ano") == ano]
    return r[:limite]


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
