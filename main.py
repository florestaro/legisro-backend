"""
LegisRO API - Backend FastAPI
Inteligencia legislativa para vereadores de Rondonia
Dados reais via SAPL (Sistema de Apoio ao Processo Legislativo)
"""

from fastapi import FastAPI, Query, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import os
from typing import Optional
from datetime import datetime

from database import init_db, buscar_leis_cache, salvar_leis, buscar_alertas, salvar_alerta, get_stats
from sapl_client import (
    buscar_normas_sapl,
    buscar_materias_sapl,
    buscar_parlamentares_sapl,
    testar_conexao_sapl,
    MUNICIPIOS_SAPL,
)

app = FastAPI(
    title="LegisRO API",
    description="API de inteligencia legislativa para vereadores de Rondonia. Dados reais via SAPL oficial.",
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    init_db()
    asyncio.create_task(sincronizar_municipio("alta-floresta-doeste"))
    asyncio.create_task(sincronizar_municipio("porto-velho"))


async def sincronizar_municipio(slug: str):
    try:
        leis = await buscar_normas_sapl(slug, limite=100)
        if leis:
            salvar_leis(leis)
            print(f"[SYNC] {slug}: {len(leis)} leis sincronizadas do SAPL")
    except Exception as e:
        print(f"[SYNC] Erro ao sincronizar {slug}: {e}")


@app.get("/")
def root():
    return {
        "app": "LegisRO API",
        "versao": "1.0.0",
        "status": "online",
        "descricao": "Inteligencia legislativa para vereadores de Rondonia",
        "dados": "SAPL Oficial (Interlegis/Senado Federal)",
        "docs": "/docs"
    }


@app.get("/stats")
async def stats():
    s = get_stats()
    return {
        "leis_coletadas": s["total_leis"],
        "municipios_com_dados": s["total_municipios"],
        "municipios_rondonia": 52,
        "alertas": s["total_alertas"],
        "fonte": "SAPL Oficial",
        "atualizado_em": datetime.now().isoformat(),
    }


@app.get("/buscar")
async def buscar(
    q: str = Query(..., description="Termo de busca"),
    municipio: Optional[str] = Query(None),
    ano: Optional[int] = Query(None),
    tipo: Optional[str] = Query(None),
    limite: int = Query(20, le=50),
    background_tasks: BackgroundTasks = None,
):
    resultados = []
    cache = buscar_leis_cache(municipio_slug=municipio, termo=q, ano=ano, limite=limite)
    resultados.extend(cache)

    if not resultados:
        municipios_buscar = [municipio] if municipio else list(MUNICIPIOS_SAPL.keys())[:5]
        tarefas = [buscar_normas_sapl(m, termo=q, ano=ano, limite=10) for m in municipios_buscar]
        resultados_sapl = await asyncio.gather(*tarefas, return_exceptions=True)
        for resultado in resultados_sapl:
            if isinstance(resultado, list):
                resultados.extend(resultado)
                if background_tasks:
                    background_tasks.add_task(salvar_leis, resultado)

    leis_formatadas = []
    for lei in resultados[:limite]:
        leis_formatadas.append({
            "id": lei.get("id"),
            "tipo": lei.get("tipo", "Lei"),
            "numero": lei.get("numero", ""),
            "ano": lei.get("ano", ""),
            "ementa": lei.get("ementa", ""),
            "data": lei.get("data_lei") or lei.get("data", ""),
            "municipio": lei.get("municipio_nome") or lei.get("municipio", ""),
            "municipio_slug": lei.get("municipio_slug", ""),
            "url_oficial": lei.get("url_oficial", ""),
            "fonte": lei.get("fonte", "SAPL Oficial"),
        })

    return {
        "total": len(leis_formatadas),
        "termo": q,
        "municipio": municipio,
        "resultados": leis_formatadas,
        "fonte": "SAPL Oficial - Sistema de Apoio ao Processo Legislativo",
    }


@app.get("/municipios")
def listar_municipios():
    return {
        "total": len(MUNICIPIOS_SAPL),
        "municipios_rondonia": 52,
        "municipios": [
            {
                "slug": slug,
                "nome": dados["nome"],
                "regiao": dados["regiao"],
                "sapl_url": dados["sapl_url"],
                "populacao": dados.get("populacao"),
            }
            for slug, dados in MUNICIPIOS_SAPL.items()
        ]
    }


@app.get("/municipios/{slug}")
async def municipio_detalhe(slug: str):
    if slug not in MUNICIPIOS_SAPL:
        raise HTTPException(status_code=404, detail="Municipio nao encontrado")
    dados = MUNICIPIOS_SAPL[slug]
    leis_cache = buscar_leis_cache(municipio_slug=slug, limite=10)
    if not leis_cache:
        leis_sapl = await buscar_normas_sapl(slug, limite=10)
        if leis_sapl:
            salvar_leis(leis_sapl)
            leis_cache = leis_sapl
    return {
        "municipio": dados["nome"],
        "slug": slug,
        "regiao": dados["regiao"],
        "sapl_url": dados["sapl_url"],
        "camara_url": dados.get("camara_url", ""),
        "populacao": dados.get("populacao"),
        "leis_recentes": [
            {
                "tipo": l.get("tipo", ""),
                "numero": l.get("numero", ""),
                "ano": l.get("ano", ""),
                "ementa": l.get("ementa", "")[:200],
                "url_oficial": l.get("url_oficial", ""),
            }
            for l in leis_cache[:10]
        ],
        "fonte": "SAPL Oficial"
    }


@app.get("/vereadores/{municipio_slug}")
async def vereadores(municipio_slug: str):
    if municipio_slug not in MUNICIPIOS_SAPL:
        raise HTTPException(status_code=404, detail="Municipio nao encontrado")
    parlamentares = await buscar_parlamentares_sapl(municipio_slug)
    return {
        "municipio": MUNICIPIOS_SAPL[municipio_slug]["nome"],
        "total": len(parlamentares),
        "vereadores": parlamentares,
        "fonte": "SAPL Oficial"
    }


@app.get("/sugestoes")
async def sugestoes(municipio: str = Query("alta-floresta-doeste")):
    if municipio not in MUNICIPIOS_SAPL:
        municipio = "alta-floresta-doeste"
    temas = ["energia solar", "saude mental", "IPTU", "agricultura familiar", "transporte escolar"]
    sugestoes_lista = []
    for tema in temas:
        leis_encontradas = buscar_leis_cache(termo=tema, limite=5)
        if not leis_encontradas:
            tarefas = [buscar_normas_sapl(m, termo=tema, limite=3)
                       for m in ["porto-velho", "ji-parana", "ariquemes"]]
            resultados = await asyncio.gather(*tarefas, return_exceptions=True)
            for r in resultados:
                if isinstance(r, list):
                    leis_encontradas.extend(r)
        if leis_encontradas:
            municipios_com_lei = list({l.get("municipio_nome") or l.get("municipio", "") for l in leis_encontradas})
            sugestoes_lista.append({
                "tema": tema.title(),
                "total_municipios": len(municipios_com_lei),
                "municipios": municipios_com_lei[:5],
                "exemplo_lei": {
                    "tipo": leis_encontradas[0].get("tipo", "Lei"),
                    "numero": leis_encontradas[0].get("numero", ""),
                    "ano": leis_encontradas[0].get("ano", ""),
                    "ementa": leis_encontradas[0].get("ementa", "")[:250],
                    "municipio": leis_encontradas[0].get("municipio_nome") or leis_encontradas[0].get("municipio", ""),
                    "url_oficial": leis_encontradas[0].get("url_oficial", ""),
                },
                "fonte": "SAPL Oficial"
            })
    return {
        "municipio_alvo": MUNICIPIOS_SAPL[municipio]["nome"],
        "total_sugestoes": len(sugestoes_lista),
        "sugestoes": sugestoes_lista,
        "nota": "Sugestoes baseadas em leis REAIS aprovadas em municipios de Rondonia via SAPL oficial.",
    }


@app.get("/alertas")
async def alertas(municipio: Optional[str] = None, limite: int = 10):
    dados = buscar_alertas(municipio_slug=municipio, limite=limite)
    return {"total": len(dados), "alertas": dados, "fonte": "SAPL Oficial"}


@app.get("/sincronizar/{municipio_slug}")
async def sincronizar(municipio_slug: str, background_tasks: BackgroundTasks):
    if municipio_slug not in MUNICIPIOS_SAPL:
        raise HTTPException(status_code=404, detail="Municipio nao encontrado")
    background_tasks.add_task(sincronizar_municipio, municipio_slug)
    return {"mensagem": f"Sincronizacao iniciada para {MUNICIPIOS_SAPL[municipio_slug]['nome']}", "slug": municipio_slug}


@app.get("/saude")
async def health_check():
    testes = await asyncio.gather(
        testar_conexao_sapl("alta-floresta-doeste"),
        testar_conexao_sapl("porto-velho"),
        return_exceptions=True
    )
    return {
        "api": "online",
        "sapl_connections": [t if isinstance(t, dict) else {"ok": False, "erro": str(t)} for t in testes],
        "db": "sqlite_local",
        "timestamp": datetime.now().isoformat()
}
