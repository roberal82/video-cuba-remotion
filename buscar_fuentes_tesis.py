#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
buscar_fuentes_tesis.py
Sistema automatizado de búsqueda y descarga de fuentes bibliográficas académicas.
Busca en Semantic Scholar, Crossref, OpenAlex, arXiv y DOAJ.
Genera matriz Excel y referencias APA 7 en DOCX.
"""

import os
import sys
import re
import time
import json
import logging
import hashlib
import unicodedata
from datetime import datetime
from pathlib import Path
from urllib.parse import urlencode, urlparse

# ─── Instalación automática de dependencias ────────────────────────────────────
REQUIRED = [
    "requests",
    "pandas",
    "openpyxl",
    "python-docx",
    "beautifulsoup4",
    "tqdm",
    "habanero",
]

def instalar_dependencias():
    import subprocess
    print("\n[SETUP] Verificando dependencias...")
    for pkg in REQUIRED:
        try:
            __import__(pkg.replace("-", "_").split("[")[0])
        except ImportError:
            print(f"  Instalando {pkg}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "-q"])
    print("[SETUP] Dependencias OK.\n")

instalar_dependencias()

# ─── Imports después de instalar ──────────────────────────────────────────────
import requests
import pandas as pd
from tqdm import tqdm
from bs4 import BeautifulSoup

try:
    from docx import Document
    from docx.shared import Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    DOCX_OK = True
except ImportError:
    DOCX_OK = False

try:
    from habanero import Crossref
    HABANERO_OK = True
except ImportError:
    HABANERO_OK = False

# ─── Configuración global ─────────────────────────────────────────────────────
SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "TesisResearcher/1.0 (mailto:investigador@tesis.edu.py)"
})
TIMEOUT = 20
DELAY = 1.2  # segundos entre peticiones para no saturar APIs

# ─── Utilidades ───────────────────────────────────────────────────────────────
def limpiar_nombre(texto: str, max_len: int = 80) -> str:
    """Convierte texto en nombre de archivo seguro para Windows."""
    texto = unicodedata.normalize("NFKD", texto)
    texto = texto.encode("ascii", "ignore").decode("ascii")
    texto = re.sub(r'[\\/*?:"<>|]', "", texto)
    texto = re.sub(r"\s+", "_", texto.strip())
    return texto[:max_len]

def normalizar_titulo(titulo: str) -> str:
    return re.sub(r"\s+", " ", titulo.lower().strip()) if titulo else ""

def sha1_doi(doi: str) -> str:
    return hashlib.sha1(doi.strip().lower().encode()).hexdigest()[:12]

def get_json(url: str, params: dict = None) -> dict | None:
    try:
        r = SESSION.get(url, params=params, timeout=TIMEOUT)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        logging.warning(f"GET {url} → {e}")
        return None

def descargar_pdf(url: str, destino: Path, log: logging.Logger) -> bool:
    """Descarga un PDF desde una URL pública y lo guarda en destino."""
    if not url:
        return False
    try:
        r = SESSION.get(url, timeout=30, stream=True, allow_redirects=True)
        ct = r.headers.get("Content-Type", "")
        if r.status_code != 200 or "pdf" not in ct.lower():
            # Segundo intento: algunos servidores redirigen
            if "html" in ct.lower():
                return False
        with open(destino, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        if destino.stat().st_size < 5000:
            destino.unlink()
            return False
        return True
    except Exception as e:
        log.warning(f"Fallo descarga PDF {url}: {e}")
        if destino.exists():
            destino.unlink()
        return False

# ─── Buscadores ──────────────────────────────────────────────────────────────

def buscar_semantic_scholar(query: str, max_results: int, year_from: int = 2015) -> list[dict]:
    """Busca en Semantic Scholar API v1."""
    resultados = []
    url = "https://api.semanticscholar.org/graph/v1/paper/search"
    campos = "paperId,title,authors,year,abstract,externalIds,openAccessPdf,publicationTypes,venue"
    offset = 0
    limit = min(100, max_results)
    print(f"  [Semantic Scholar] Buscando: {query[:60]}...")

    while len(resultados) < max_results:
        params = {
            "query": query,
            "fields": campos,
            "limit": limit,
            "offset": offset,
        }
        data = get_json(url, params)
        if not data or "data" not in data:
            break
        items = data["data"]
        if not items:
            break
        for item in items:
            year = item.get("year") or 0
            if year and year < year_from:
                continue
            autores = [a.get("name", "") for a in item.get("authors", [])]
            doi = (item.get("externalIds") or {}).get("DOI", "")
            arxiv = (item.get("externalIds") or {}).get("ArXiv", "")
            pdf_url = ""
            oa = item.get("openAccessPdf")
            if oa:
                pdf_url = oa.get("url", "")
            tipos = item.get("publicationTypes") or []
            tipo = clasificar_tipo(tipos, item.get("venue", ""))
            resultados.append({
                "titulo": item.get("title", ""),
                "autores": "; ".join(autores),
                "año": year,
                "tipo": tipo,
                "fuente": "Semantic Scholar",
                "doi": doi,
                "arxiv": arxiv,
                "url": pdf_url or (f"https://arxiv.org/pdf/{arxiv}" if arxiv else ""),
                "pdf_url": pdf_url,
                "resumen": (item.get("abstract") or "")[:500],
                "palabras_clave": "",
                "venue": item.get("venue", ""),
            })
        offset += len(items)
        if offset >= (data.get("total") or 0):
            break
        time.sleep(DELAY)

    print(f"    → {len(resultados)} resultados encontrados")
    return resultados[:max_results]


def buscar_openalex(query: str, max_results: int, year_from: int = 2015) -> list[dict]:
    """Busca en OpenAlex API."""
    resultados = []
    url = "https://api.openalex.org/works"
    print(f"  [OpenAlex] Buscando: {query[:60]}...")
    page = 1
    per_page = min(200, max_results)

    while len(resultados) < max_results:
        params = {
            "search": query,
            "filter": f"publication_year:>{year_from - 1},is_oa:true",
            "per-page": per_page,
            "page": page,
            "mailto": "investigador@tesis.edu.py",
        }
        data = get_json(url, params)
        if not data or "results" not in data:
            break
        items = data["results"]
        if not items:
            break
        for item in items:
            year = item.get("publication_year") or 0
            autores_raw = item.get("authorships") or []
            autores = [a.get("author", {}).get("display_name", "") for a in autores_raw[:6]]
            doi = (item.get("doi") or "").replace("https://doi.org/", "")
            oa_url = item.get("open_access", {}).get("oa_url", "") or ""
            tipo = (item.get("type") or "article").capitalize()
            kw = [k.get("display_name", "") for k in (item.get("keywords") or [])[:8]]
            resultados.append({
                "titulo": item.get("display_name", ""),
                "autores": "; ".join(autores),
                "año": year,
                "tipo": tipo,
                "fuente": "OpenAlex",
                "doi": doi,
                "arxiv": "",
                "url": oa_url,
                "pdf_url": oa_url if oa_url and oa_url.endswith(".pdf") else "",
                "resumen": (item.get("abstract") or "")[:500],
                "palabras_clave": "; ".join(kw),
                "venue": (item.get("primary_location") or {}).get("source", {}).get("display_name", "") if item.get("primary_location") else "",
            })
        page += 1
        total = data.get("meta", {}).get("count", 0)
        if page * per_page >= total:
            break
        time.sleep(DELAY)

    print(f"    → {len(resultados)} resultados encontrados")
    return resultados[:max_results]


def buscar_crossref(query: str, max_results: int, year_from: int = 2015) -> list[dict]:
    """Busca en Crossref via habanero o requests."""
    resultados = []
    print(f"  [Crossref] Buscando: {query[:60]}...")

    if HABANERO_OK:
        try:
            cr = Crossref(mailto="investigador@tesis.edu.py")
            resp = cr.works(
                query=query,
                limit=min(max_results, 100),
                filter={"from-pub-date": str(year_from)},
                select="DOI,title,author,published,abstract,link,type,container-title",
            )
            items = resp["message"]["items"]
            for item in items:
                titulos = item.get("title") or []
                titulo = titulos[0] if titulos else ""
                autores_raw = item.get("author") or []
                autores = [f"{a.get('family','')}, {a.get('given','')}" for a in autores_raw[:6]]
                pub = item.get("published") or item.get("published-print") or {}
                dp = pub.get("date-parts", [[0]])[0]
                year = dp[0] if dp else 0
                doi = item.get("DOI", "")
                links = item.get("link") or []
                pdf_url = next((l["URL"] for l in links if "pdf" in l.get("content-type", "").lower()), "")
                tipo = item.get("type", "journal-article").replace("-", " ").title()
                journal = (item.get("container-title") or [""])[0]
                resultados.append({
                    "titulo": titulo,
                    "autores": "; ".join(autores),
                    "año": year,
                    "tipo": tipo,
                    "fuente": "Crossref",
                    "doi": doi,
                    "arxiv": "",
                    "url": f"https://doi.org/{doi}" if doi else "",
                    "pdf_url": pdf_url,
                    "resumen": (item.get("abstract") or "")[:500],
                    "palabras_clave": "",
                    "venue": journal,
                })
        except Exception as e:
            logging.warning(f"Crossref habanero error: {e}")
    else:
        # Fallback via REST API directa
        url = "https://api.crossref.org/works"
        params = {
            "query": query,
            "rows": min(max_results, 100),
            "filter": f"from-pub-date:{year_from}",
            "mailto": "investigador@tesis.edu.py",
        }
        data = get_json(url, params)
        if data:
            items = data.get("message", {}).get("items", [])
            for item in items:
                titulos = item.get("title") or []
                titulo = titulos[0] if titulos else ""
                autores_raw = item.get("author") or []
                autores = [f"{a.get('family','')}, {a.get('given','')}" for a in autores_raw[:6]]
                pub = item.get("published") or item.get("published-print") or {}
                dp = pub.get("date-parts", [[0]])[0]
                year = dp[0] if dp else 0
                doi = item.get("DOI", "")
                links = item.get("link") or []
                pdf_url = next((l["URL"] for l in links if "pdf" in l.get("content-type", "").lower()), "")
                tipo = item.get("type", "journal-article").replace("-", " ").title()
                journal = (item.get("container-title") or [""])[0]
                resultados.append({
                    "titulo": titulo,
                    "autores": "; ".join(autores),
                    "año": year,
                    "tipo": tipo,
                    "fuente": "Crossref",
                    "doi": doi,
                    "arxiv": "",
                    "url": f"https://doi.org/{doi}" if doi else "",
                    "pdf_url": pdf_url,
                    "resumen": (item.get("abstract") or "")[:500],
                    "palabras_clave": "",
                    "venue": journal,
                })

    print(f"    → {len(resultados)} resultados encontrados")
    return resultados[:max_results]


def buscar_arxiv(query: str, max_results: int, year_from: int = 2015) -> list[dict]:
    """Busca en arXiv API (acceso completamente libre)."""
    resultados = []
    print(f"  [arXiv] Buscando: {query[:60]}...")
    url = "http://export.arxiv.org/api/query"
    params = {
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": min(max_results, 50),
        "sortBy": "relevance",
    }
    try:
        r = SESSION.get(url, params=params, timeout=TIMEOUT)
        soup = BeautifulSoup(r.content, "xml")
        entries = soup.find_all("entry")
        for entry in entries:
            published = entry.find("published")
            year = int(published.text[:4]) if published else 0
            if year < year_from:
                continue
            titulo = (entry.find("title") or {}).text.strip().replace("\n", " ")
            autores = [a.find("name").text for a in entry.find_all("author") if a.find("name")]
            arxiv_id = (entry.find("id") or {}).text.strip().split("/abs/")[-1]
            pdf_url = f"https://arxiv.org/pdf/{arxiv_id}"
            resumen = (entry.find("summary") or {}).text.strip()[:500]
            resultados.append({
                "titulo": titulo,
                "autores": "; ".join(autores[:6]),
                "año": year,
                "tipo": "Preprint / Article",
                "fuente": "arXiv",
                "doi": "",
                "arxiv": arxiv_id,
                "url": f"https://arxiv.org/abs/{arxiv_id}",
                "pdf_url": pdf_url,
                "resumen": resumen,
                "palabras_clave": "",
                "venue": "arXiv",
            })
    except Exception as e:
        logging.warning(f"arXiv error: {e}")

    print(f"    → {len(resultados)} resultados encontrados")
    return resultados


def buscar_doaj(query: str, max_results: int, year_from: int = 2015) -> list[dict]:
    """Busca en DOAJ (Directory of Open Access Journals)."""
    resultados = []
    print(f"  [DOAJ] Buscando: {query[:60]}...")
    url = "https://doaj.org/api/search/articles/" + requests.utils.quote(query)
    params = {"pageSize": min(max_results, 100), "page": 1}
    data = get_json(url, params)
    if data and "results" in data:
        for item in data["results"]:
            bib = item.get("bibjson", {})
            year = bib.get("year") or 0
            try:
                year = int(year)
            except (ValueError, TypeError):
                year = 0
            if year and year < year_from:
                continue
            autores = [f"{a.get('name','')}" for a in bib.get("author", [])[:6]]
            links = bib.get("link") or []
            pdf_url = next((l["url"] for l in links if l.get("type") == "fulltext"), "")
            doi = next((i["id"] for i in bib.get("identifier", []) if i.get("type") == "doi"), "")
            journal = (bib.get("journal") or {}).get("title", "")
            kw = bib.get("keywords") or []
            resultados.append({
                "titulo": bib.get("title", ""),
                "autores": "; ".join(autores),
                "año": year,
                "tipo": "Journal Article",
                "fuente": "DOAJ",
                "doi": doi,
                "arxiv": "",
                "url": pdf_url,
                "pdf_url": pdf_url if pdf_url.endswith(".pdf") else "",
                "resumen": (bib.get("abstract") or "")[:500],
                "palabras_clave": "; ".join(kw[:8]),
                "venue": journal,
            })
    print(f"    → {len(resultados)} resultados encontrados")
    return resultados


# ─── Clasificación de tipo de documento ──────────────────────────────────────
def clasificar_tipo(tipos: list, venue: str = "") -> str:
    tipos_str = " ".join(tipos).lower()
    venue_l = venue.lower()
    if "thesis" in tipos_str or "dissertation" in venue_l or "tesis" in venue_l:
        return "Tesis"
    if "book" in tipos_str or "chapter" in tipos_str:
        return "Libro / Capítulo"
    if "report" in tipos_str or "technical" in tipos_str or "informe" in venue_l:
        return "Informe Institucional"
    if "conference" in tipos_str or "proceedings" in tipos_str:
        return "Artículo Científico"
    return "Artículo Científico"


def carpeta_por_tipo(tipo: str) -> str:
    mapa = {
        "Tesis": "Tesis",
        "Libro / Capítulo": "Libros_Capitulos",
        "Informe Institucional": "Informes_Institucionales",
    }
    return mapa.get(tipo, "Articulos_Cientificos")


# ─── Generación de cita APA 7 ─────────────────────────────────────────────────
def generar_apa7(r: dict) -> str:
    autores_raw = r.get("autores", "")
    autores_lista = [a.strip() for a in autores_raw.split(";") if a.strip()]

    def formato_apellido(nombre: str) -> str:
        partes = nombre.strip().split(",")
        if len(partes) == 2:
            apellido = partes[0].strip()
            iniciales = "".join(f"{n[0].upper()}." for n in partes[1].split() if n)
            return f"{apellido}, {iniciales}"
        partes2 = nombre.strip().split()
        if len(partes2) >= 2:
            apellido = partes2[-1]
            iniciales = "".join(f"{n[0].upper()}." for n in partes2[:-1])
            return f"{apellido}, {iniciales}"
        return nombre

    if not autores_lista:
        autores_apa = "Autor desconocido"
    elif len(autores_lista) <= 20:
        formatted = [formato_apellido(a) for a in autores_lista]
        if len(formatted) == 1:
            autores_apa = formatted[0]
        elif len(formatted) == 2:
            autores_apa = f"{formatted[0]}, & {formatted[1]}"
        else:
            autores_apa = ", ".join(formatted[:-1]) + f", & {formatted[-1]}"
    else:
        formatted = [formato_apellido(a) for a in autores_lista[:19]]
        autores_apa = ", ".join(formatted) + f", ... {formato_apellido(autores_lista[-1])}"

    año = r.get("año") or "s.f."
    titulo = r.get("titulo", "Sin título")
    venue = r.get("venue", "")
    doi = r.get("doi", "")
    url = r.get("url", "")
    tipo = r.get("tipo", "Artículo Científico")

    doi_link = f" https://doi.org/{doi}" if doi else (f" {url}" if url else "")

    if "Tesis" in tipo:
        cita = f"{autores_apa} ({año}). {titulo} [Tesis de grado/posgrado]. {venue or 'Institución no especificada'}.{doi_link}"
    elif "Libro" in tipo:
        cita = f"{autores_apa} ({año}). {titulo}. Editorial no especificada.{doi_link}"
    elif "Informe" in tipo:
        cita = f"{autores_apa} ({año}). {titulo}. {venue or 'Organización'}.{doi_link}"
    else:
        cita = f"{autores_apa} ({año}). {titulo}. {venue or 'Revista no especificada'}.{doi_link}"

    return cita


# ─── Eliminación de duplicados ────────────────────────────────────────────────
def deduplicar(registros: list[dict]) -> list[dict]:
    vistos_doi = set()
    vistos_titulo = set()
    unicos = []
    for r in registros:
        doi = (r.get("doi") or "").strip().lower()
        titulo_norm = normalizar_titulo(r.get("titulo", ""))
        if doi and doi in vistos_doi:
            continue
        if titulo_norm and titulo_norm in vistos_titulo:
            continue
        if doi:
            vistos_doi.add(doi)
        if titulo_norm:
            vistos_titulo.add(titulo_norm)
        unicos.append(r)
    return unicos


# ─── Exportación Excel ────────────────────────────────────────────────────────
def exportar_excel(registros: list[dict], ruta: Path):
    filas = []
    for i, r in enumerate(registros, 1):
        filas.append({
            "Nº": i,
            "Título": r.get("titulo", ""),
            "Autor/es": r.get("autores", ""),
            "Año": r.get("año", ""),
            "Tipo de documento": r.get("tipo", ""),
            "Fuente / Base de datos": r.get("fuente", ""),
            "DOI": r.get("doi", ""),
            "URL": r.get("url", ""),
            "PDF descargado": "Sí" if r.get("pdf_descargado") else "No",
            "Nombre del archivo PDF": r.get("archivo_pdf", ""),
            "Resumen": r.get("resumen", ""),
            "Palabras clave": r.get("palabras_clave", ""),
            "Relevancia para la tesis": r.get("relevancia", ""),
            "Cita APA 7": r.get("cita_apa7", ""),
        })
    df = pd.DataFrame(filas)
    with pd.ExcelWriter(ruta, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Fuentes")
        ws = writer.sheets["Fuentes"]
        # Formato de encabezado
        from openpyxl.styles import Font, PatternFill, Alignment
        header_fill = PatternFill("solid", fgColor="1F3864")
        for cell in ws[1]:
            cell.font = Font(bold=True, color="FFFFFF", size=10)
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center", wrap_text=True)
        # Anchos
        anchos = [5, 60, 35, 6, 20, 18, 25, 50, 14, 35, 80, 40, 30, 120]
        for i, ancho in enumerate(anchos, 1):
            ws.column_dimensions[ws.cell(1, i).column_letter].width = ancho
        # Wrap texto en columnas largas
        for row in ws.iter_rows(min_row=2):
            for cell in row:
                cell.alignment = Alignment(wrap_text=True, vertical="top")
    print(f"  [Excel] Guardado: {ruta.name}")


# ─── Exportación DOCX APA 7 ──────────────────────────────────────────────────
def exportar_docx(registros: list[dict], ruta: Path, titulo_tesis: str):
    if not DOCX_OK:
        print("  [DOCX] python-docx no disponible. Saltando.")
        return
    doc = Document()
    # Estilo
    style = doc.styles["Normal"]
    style.font.name = "Times New Roman"
    style.font.size = Pt(12)

    # Título
    h = doc.add_heading("Referencias Bibliográficas", 0)
    h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph(f"Tesis: {titulo_tesis}")
    doc.add_paragraph(f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    doc.add_paragraph(f"Total de referencias: {len(registros)}")
    doc.add_paragraph()

    doc.add_heading("Lista de Referencias (APA 7ª edición)", level=1)
    doc.add_paragraph()

    # Ordenar alfabéticamente por primer autor / título
    def sort_key(r):
        autores = r.get("autores", "") or ""
        titulo = r.get("titulo", "") or ""
        return (autores.split(";")[0].split(",")[0].strip().lower() or titulo.lower())

    ordenados = sorted(registros, key=sort_key)

    for r in ordenados:
        cita = r.get("cita_apa7", generar_apa7(r))
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Pt(36)
        p.paragraph_format.first_line_indent = Pt(-36)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(cita)
        run.font.size = Pt(12)

    doc.save(ruta)
    print(f"  [DOCX] Guardado: {ruta.name}")


# ─── Función principal ────────────────────────────────────────────────────────
def main():
    print("=" * 70)
    print("  SISTEMA DE BÚSQUEDA BIBLIOGRÁFICA ACADÉMICA - TESIS DRONES / CODI")
    print("=" * 70)

    # ── Entrada del usuario ──────────────────────────────────────────────────
    titulo_tesis = input(
        "\nTítulo de la tesis [Enter para usar el título por defecto]:\n> "
    ).strip()
    if not titulo_tesis:
        titulo_tesis = (
            "EL EMPLEO DE DRONES EN APOYO A LA INTELIGENCIA MILITAR EN EL "
            "COMANDO DE OPERACIONES DE DEFENSA INTERNA (CODI) 2025-2026"
        )

    kw_input = input(
        "\nPalabras clave adicionales (separadas por coma) [Enter para usar predeterminadas]:\n> "
    ).strip()

    max_input = input("\nCantidad máxima de artículos a buscar por fuente [default 30]: ").strip()
    try:
        MAX_POR_FUENTE = int(max_input) if max_input else 30
    except ValueError:
        MAX_POR_FUENTE = 30

    carpeta_input = input(
        "\nCarpeta de destino [Enter = escritorio\\Fuentes_Tesis_Drones_CODI]: "
    ).strip()
    if not carpeta_input:
        escritorio = Path.home() / "Desktop"
        if not escritorio.exists():
            escritorio = Path.home() / "OneDrive" / "Desktop"
        CARPETA_BASE = escritorio / "Fuentes_Tesis_Drones_CODI"
    else:
        CARPETA_BASE = Path(carpeta_input)

    # ── Crear estructura de carpetas ─────────────────────────────────────────
    subcarpetas = [
        "Articulos_Cientificos",
        "Tesis",
        "Informes_Institucionales",
        "Libros_Capitulos",
        "No_Descargados",
    ]
    CARPETA_BASE.mkdir(parents=True, exist_ok=True)
    for sc in subcarpetas:
        (CARPETA_BASE / sc).mkdir(exist_ok=True)

    # ── Logging ──────────────────────────────────────────────────────────────
    log_path = CARPETA_BASE / "busqueda.log"
    logging.basicConfig(
        filename=str(log_path),
        level=logging.WARNING,
        format="%(asctime)s %(levelname)s: %(message)s",
        encoding="utf-8",
    )
    log = logging.getLogger()

    print(f"\n[INFO] Carpeta base: {CARPETA_BASE}")
    print(f"[INFO] Log: {log_path}\n")

    # ── Queries predefinidas ─────────────────────────────────────────────────
    queries_base = [
        "military drones UAV intelligence surveillance reconnaissance",
        "unmanned aerial vehicles military intelligence ISR",
        "drones internal security counterinsurgency surveillance",
        "UAV border surveillance military operations",
        "drone technology military Latin America defense",
        "inteligencia militar drones seguridad interna",
        "drones seguridad interior defensa nacional Paraguay",
        "unmanned aerial systems combat support operations",
        "military intelligence collection drones ISR platforms",
        "drones counterterrorism law enforcement surveillance",
    ]

    if kw_input:
        queries_base.insert(0, kw_input)

    # ── Búsqueda en todas las fuentes ────────────────────────────────────────
    todos = []
    print("\n[BÚSQUEDA] Iniciando consultas a bases de datos académicas...\n")

    for q in queries_base[:5]:  # Primeras 5 queries para no saturar
        print(f"\n--- Query: '{q[:55]}...' ---")
        todos += buscar_semantic_scholar(q, MAX_POR_FUENTE)
        time.sleep(DELAY)
        todos += buscar_openalex(q, MAX_POR_FUENTE)
        time.sleep(DELAY)
        todos += buscar_crossref(q, MAX_POR_FUENTE)
        time.sleep(DELAY)
        todos += buscar_arxiv(q, min(MAX_POR_FUENTE, 20))
        time.sleep(DELAY)
        todos += buscar_doaj(q, MAX_POR_FUENTE)
        time.sleep(DELAY)

    print(f"\n[INFO] Total bruto: {len(todos)} registros")

    # ── Deduplicar ───────────────────────────────────────────────────────────
    unicos = deduplicar(todos)
    print(f"[INFO] Después de deduplicar: {len(unicos)} registros únicos")

    # ── Filtrar solo con título válido y año razonable ────────────────────────
    unicos = [r for r in unicos if r.get("titulo") and len(r["titulo"]) > 5]
    unicos = [r for r in unicos if not r.get("año") or r["año"] >= 2010]

    # ── Generar citas APA 7 ──────────────────────────────────────────────────
    for r in unicos:
        r["cita_apa7"] = generar_apa7(r)
        r["relevancia"] = ""
        r["pdf_descargado"] = False
        r["archivo_pdf"] = ""

    # ── Descarga de PDFs ─────────────────────────────────────────────────────
    print(f"\n[DESCARGA] Intentando descargar PDFs ({len(unicos)} registros)...\n")
    descargados = 0
    no_descargados = []

    for r in tqdm(unicos, desc="Descargando", unit="art"):
        pdf_url = r.get("pdf_url", "")
        if not pdf_url:
            # Intentar construir URL desde arXiv
            if r.get("arxiv"):
                pdf_url = f"https://arxiv.org/pdf/{r['arxiv']}"

        if not pdf_url:
            no_descargados.append(r)
            continue

        tipo = r.get("tipo", "Artículo Científico")
        subcarpeta = carpeta_por_tipo(tipo)
        nombre_base = limpiar_nombre(r.get("titulo", "sin_titulo"))
        if r.get("doi"):
            nombre_base += f"_{sha1_doi(r['doi'])}"
        elif r.get("arxiv"):
            nombre_base += f"_{r['arxiv'].replace('/', '_')}"
        archivo = CARPETA_BASE / subcarpeta / f"{nombre_base}.pdf"

        if archivo.exists():
            r["pdf_descargado"] = True
            r["archivo_pdf"] = archivo.name
            descargados += 1
            continue

        ok = descargar_pdf(pdf_url, archivo, log)
        if ok:
            r["pdf_descargado"] = True
            r["archivo_pdf"] = archivo.name
            descargados += 1
        else:
            no_descargados.append(r)
            # Guardar referencia en carpeta No_Descargados
            ref_txt = CARPETA_BASE / "No_Descargados" / f"{nombre_base}.txt"
            try:
                ref_txt.write_text(
                    f"Título: {r.get('titulo','')}\n"
                    f"Autores: {r.get('autores','')}\n"
                    f"Año: {r.get('año','')}\n"
                    f"DOI: {r.get('doi','')}\n"
                    f"URL: {r.get('url','')}\n"
                    f"PDF URL: {pdf_url}\n"
                    f"APA 7: {r.get('cita_apa7','')}\n",
                    encoding="utf-8",
                )
            except Exception:
                pass

        time.sleep(0.5)

    print(f"\n[RESULTADO] PDFs descargados: {descargados} / {len(unicos)}")

    # ── Exportar Excel ───────────────────────────────────────────────────────
    excel_path = CARPETA_BASE / "matriz_fuentes_bibliograficas.xlsx"
    exportar_excel(unicos, excel_path)

    # ── Exportar DOCX ────────────────────────────────────────────────────────
    docx_path = CARPETA_BASE / "referencias_apa7.docx"
    exportar_docx(unicos, docx_path, titulo_tesis)

    # ── Resumen final ─────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("  RESUMEN FINAL")
    print("=" * 70)
    print(f"  Registros únicos encontrados : {len(unicos)}")
    print(f"  PDFs descargados             : {descargados}")
    print(f"  No descargados               : {len(no_descargados)}")
    print(f"  Carpeta principal            : {CARPETA_BASE}")
    print(f"  Matriz Excel                 : {excel_path.name}")
    print(f"  Referencias APA 7            : {docx_path.name}")
    print(f"  Log de errores               : {log_path.name}")
    print("=" * 70)
    print("\n[OK] Proceso completado.\n")

    # Abrir carpeta automáticamente en Windows
    try:
        os.startfile(str(CARPETA_BASE))
    except Exception:
        pass


if __name__ == "__main__":
    main()
