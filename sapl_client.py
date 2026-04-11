"""
LegisRO - Cliente SAPL
Integracao com os sistemas SAPL oficiais dos municipios de Rondonia.
SAPL = Sistema de Apoio ao Processo Legislativo (Interlegis/Senado Federal)
"""

import httpx
import asyncio
from typing import Optional

# Municipios de Rondonia com SAPL confirmado
MUNICIPIOS_SAPL = {
    "alta-floresta-doeste": {
        "nome": "Alta Floresta D'Oeste",
        "sapl_url": "https://sapl.altaflorestadoeste.ro.leg.br",
        "regiao": "Zona da Mata",
        "camara_url": "https://www.altaflorestadoeste.ro.leg.br",
        "populacao": 22000,
    },
    "porto-velho": {
        "nome": "Porto Velho",
        "sapl_url": "https://sapl.portovelho.ro.leg.br",
        "regiao": "Vale do Madeira",
        "camara_url": "https://www.camaraportovelho.ro.leg.br",
        "populacao": 539354,
    },
    "campo-novo-rondonia": {
        "nome": "Campo Novo de Rondonia",
        "sapl_url": "https://sapl.camponovoderondonia.ro.leg.br",
        "regiao": "Vale do Jamari",
        "camara_url": "https://www.camponovoderondonia.ro.leg.br",
        "populacao": 12000,
    },
    "ji-parana": {
        "nome": "Ji-Parana",
        "sapl_url": "https://sapl.ji-parana.ro.leg.br",
        "regiao": "Central",
        "camara_url": "https://www.ji-parana.ro.leg.br",
        "populacao": 136391,
    },
    "ariquemes": {
        "nome": "Ariquemes",
        "sapl_url": "https://sapl.ariquemes.ro.leg.br",
        "regiao": "Vale do Jamari",
        "camara_url": "https://www.ariquemes.ro.leg.br",
        "populacao": 118000,
    },
    "vilhena": {
        "nome": "Vilhena",
        "sapl_url": "https://sapl.vilhena.ro.leg.br",
        "regiao": "Cone Sul",
        "camara_url": "https://www.vilhena.ro.leg.br",
        "populacao": 100000,
    },
    "cacoal": {
        "nome": "Cacoal",
        "sapl_url": "https://sapl.cacoal.ro.leg.br",
        "regiao": "Zona da Mata",
        "camara_url": "https://www.cacoal.ro.leg.br",
        "populacao": 88000,
    },
    "rolim-de-moura": {
        "nome": "Rolim de Moura",
        "sapl_url": "https://sapl.rolimde-moura.ro.leg.br",
        "regiao": "Zona da Mata",
        "camara_url": "https://www.rolimde-moura.ro.leg.br",
        "populacao": 56000,
    },
    "ouro-preto-do-oeste": {
        "nome": "Ouro Preto do Oeste",
        "sapl_url": "https://sapl.ouropretodooeste.ro.leg.br",
        "regiao": "Zona da Mata",
        "camara_url": "https://www.ouropretodooeste.ro.leg.br",
        "populacao": 40000,
    },
    "nova-brasilandia-do-este": {
        "nome": "Nova Brasilandia D'Oeste",
        "sapl_url": "https://www.novabrasilandiadoeste.ro.leg.br",
        "regiao": "Zona da Mata",
        "camara_url": "https://www.novabrasilandiadoeste.ro.leg.br",
        "populacao": 18000,
    },
}


async def buscar_normas_sapl(
    municipio_slug: str,
    termo: Optional[str] = None,
    tipo: Optional[str] = None,
    ano: Optional[int] = None,
    limite: int = 20
) -> list[dict]:
    municipio = MUNICIPIOS_SAPL.get(municipio_slug)
    if not municipio:
        return []
    base_url = municipio["sapl_url"]
    params = {"format": "json", "page_size": limite}
    if termo:
        params["search"] = termo
    if tipo:
        params["tipo"] = tipo
    if ano:
        params["ano"] = ano
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(
                f"{base_url}/api/base/norma/",
                params=params,
                headers={"Accept": "application/json", "User-Agent": "LegisRO/1.0"}
            )
            if response.status_code == 200:
                data = response.json()
                resultados = data.get("results", data) if isinstance(data, dict) else data
                leis = []
                for norma in resultados[:limite]:
                    tipo_norma = norma.get("tipo", {})
                    if isinstance(tipo_norma, dict):
                        tipo_nome = tipo_norma.get("sigla", tipo_norma.get("descricao", "Lei"))
                    else:
                        tipo_nome = str(tipo_norma)
                    lei = {
                        "id": norma.get("id"),
                        "numero": norma.get("numero", ""),
                        "ano": norma.get("ano", ""),
                        "tipo": tipo_nome,
                        "ementa": norma.get("ementa", ""),
                        "data": norma.get("data", ""),
                        "municipio": municipio["nome"],
                        "municipio_slug": municipio_slug,
                        "url_oficial": f"{base_url}/norma/{norma.get('id', '')}",
                        "fonte": "SAPL Oficial"
                    }
                    leis.append(lei)
                return leis
    except Exception:
        pass
    return []


async def buscar_materias_sapl(
    municipio_slug: str,
    termo: Optional[str] = None,
    ano: Optional[int] = None,
    limite: int = 20
) -> list[dict]:
    municipio = MUNICIPIOS_SAPL.get(municipio_slug)
    if not municipio:
        return []
    base_url = municipio["sapl_url"]
    params = {"format": "json", "page_size": limite}
    if termo:
        params["search"] = termo
    if ano:
        params["ano"] = ano
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(
                f"{base_url}/api/materia/materilegislativa/",
                params=params,
                headers={"Accept": "application/json", "User-Agent": "LegisRO/1.0"}
            )
            if response.status_code == 200:
                data = response.json()
                resultados = data.get("results", data) if isinstance(data, dict) else data
                materias = []
                for m in resultados[:limite]:
                    tipo = m.get("tipo", {})
                    tipo_nome = tipo.get("sigla", "PL") if isinstance(tipo, dict) else str(tipo)
                    materia = {
                        "id": m.get("id"),
                        "numero": m.get("numero", ""),
                        "ano": m.get("ano", ""),
                        "tipo": tipo_nome,
                        "ementa": m.get("ementa", ""),
                        "data_apresentacao": m.get("data_apresentacao", ""),
                        "em_tramitacao": m.get("em_tramitacao", False),
                        "municipio": municipio["nome"],
                        "municipio_slug": municipio_slug,
                        "url_oficial": f"{base_url}/materia/{m.get('id', '')}",
                        "fonte": "SAPL Oficial"
                    }
                    materias.append(materia)
                return materias
    except Exception:
        pass
    return []


async def buscar_parlamentares_sapl(municipio_slug: str) -> list[dict]:
    municipio = MUNICIPIOS_SAPL.get(municipio_slug)
    if not municipio:
        return []
    base_url = municipio["sapl_url"]
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(
                f"{base_url}/api/parlamentar/parlamentar/",
                params={"format": "json", "ativo": "True"},
                headers={"Accept": "application/json", "User-Agent": "LegisRO/1.0"}
            )
            if response.status_code == 200:
                data = response.json()
                resultados = data.get("results", data) if isinstance(data, dict) else data
                parlamentares = []
                for p in resultados:
                    parlamentar = {
                        "id": p.get("id"),
                        "nome": p.get("nome_parlamentar", p.get("nome_completo", "")),
                        "nome_completo": p.get("nome_completo", ""),
                        "partido": p.get("partido", {}).get("sigla", "") if isinstance(p.get("partido"), dict) else "",
                        "municipio": municipio["nome"],
                        "municipio_slug": municipio_slug,
                        "foto": p.get("foto", None),
                        "url_oficial": f"{base_url}/parlamentar/{p.get('id', '')}",
                        "fonte": "SAPL Oficial"
                    }
                    parlamentares.append(parlamentar)
                return parlamentares
    except Exception:
        pass
    if municipio_slug == "alta-floresta-doeste":
        return [
            {"nome": "Nata Soares", "cargo": "Presidente", "municipio": "Alta Floresta D'Oeste", "url_oficial": "https://sapl.altaflorestadoeste.ro.leg.br/parlamentar/9"},
            {"nome": "Andre Selepenque", "municipio": "Alta Floresta D'Oeste", "url_oficial": "https://sapl.altaflorestadoeste.ro.leg.br/parlamentar/75"},
            {"nome": "Flamarion da Saude", "municipio": "Alta Floresta D'Oeste", "url_oficial": "https://sapl.altaflorestadoeste.ro.leg.br/parlamentar/76"},
            {"nome": "Negao Monteiro", "municipio": "Alta Floresta D'Oeste", "url_oficial": "https://sapl.altaflorestadoeste.ro.leg.br/parlamentar/11"},
            {"nome": "Alvaro Bueno", "municipio": "Alta Floresta D'Oeste", "url_oficial": "https://sapl.altaflorestadoeste.ro.leg.br/parlamentar/59"},
            {"nome": "Dalton Tupari", "municipio": "Alta Floresta D'Oeste", "url_oficial": "https://sapl.altaflorestadoeste.ro.leg.br/parlamentar/3"},
            {"nome": "Marilza da Revil", "municipio": "Alta Floresta D'Oeste", "url_oficial": "https://sapl.altaflorestadoeste.ro.leg.br/parlamentar/8"},
            {"nome": "Jeremias", "municipio": "Alta Floresta D'Oeste", "url_oficial": "https://sapl.altaflorestadoeste.ro.leg.br/parlamentar/4"},
            {"nome": "Nenao", "municipio": "Alta Floresta D'Oeste", "url_oficial": "https://sapl.altaflorestadoeste.ro.leg.br/parlamentar/2"},
            {"nome": "Tia Fia", "municipio": "Alta Floresta D'Oeste", "url_oficial": "https://sapl.altaflorestadoeste.ro.leg.br/parlamentar/77"},
        ]
    return []


async def testar_conexao_sapl(municipio_slug: str) -> dict:
    municipio = MUNICIPIOS_SAPL.get(municipio_slug)
    if not municipio:
        return {"ok": False, "erro": "Municipio nao cadastrado"}
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            r = await client.get(
                f"{municipio['sapl_url']}/api/base/norma/?format=json&page_size=1",
                headers={"Accept": "application/json"}
            )
            return {"ok": r.status_code == 200, "status": r.status_code, "municipio": municipio["nome"]}
    except Exception as e:
        return {"ok": False, "erro": str(e), "municipio": municipio["nome"]}
