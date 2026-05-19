# Sistema de Búsqueda Bibliográfica — Tesis Drones / CODI

## Descripción
Script Python que busca fuentes académicas en Semantic Scholar, OpenAlex, Crossref, arXiv y DOAJ, descarga PDFs legales y genera una matriz Excel + referencias APA 7 en Word.

---

## Instalación rápida

```bash
# 1. Instalar dependencias
pip install -r requirements_tesis.txt

# 2. Ejecutar el script
python buscar_fuentes_tesis.py
```

---

## Ejemplo de ejecución

```
Título de la tesis [Enter para usar el título por defecto]:
> [Enter]

Palabras clave adicionales (separadas por coma) [Enter para usar predeterminadas]:
> CODI Paraguay, drones defensa interna

Cantidad máxima de artículos a buscar por fuente [default 30]:
> 50

Carpeta de destino [Enter = escritorio\Fuentes_Tesis_Drones_CODI]:
> [Enter]
```

---

## Estructura de salida

```
Fuentes_Tesis_Drones_CODI/
├── Articulos_Cientificos/        ← PDFs de artículos de revistas
├── Tesis/                        ← PDFs de tesis académicas
├── Informes_Institucionales/     ← PDFs de informes y reportes
├── Libros_Capitulos/             ← PDFs de libros y capítulos
├── No_Descargados/               ← Referencias .txt de lo no descargado
├── matriz_fuentes_bibliograficas.xlsx
├── referencias_apa7.docx
└── busqueda.log
```

---

## Bases de datos consultadas

| Base de datos    | Tipo                        | Acceso abierto |
|------------------|-----------------------------|----------------|
| Semantic Scholar | Artículos científicos       | Sí             |
| OpenAlex         | Artículos, tesis, informes  | Sí             |
| Crossref         | Metadatos + DOI             | Sí (metadatos) |
| arXiv            | Preprints técnicos          | Sí             |
| DOAJ             | Revistas de acceso abierto  | Sí             |

---

## Archivo Excel generado

Columnas incluidas:
- Nº | Título | Autor/es | Año | Tipo de documento
- Fuente / Base de datos | DOI | URL
- PDF descargado: Sí/No | Nombre del archivo PDF
- Resumen | Palabras clave
- Relevancia para la tesis ← completar manualmente
- Cita APA 7

---

## Palabras clave preconfiguradas

```
military drones UAV intelligence surveillance reconnaissance
unmanned aerial vehicles military intelligence ISR
drones internal security counterinsurgency surveillance
UAV border surveillance military operations
drone technology military Latin America defense
inteligencia militar drones seguridad interna
drones seguridad interior defensa nacional Paraguay
unmanned aerial systems combat support operations
military intelligence collection drones ISR platforms
drones counterterrorism law enforcement surveillance
```

---

## Recomendaciones para ampliar la búsqueda

1. **Repositorios institucionales**: Buscar en repositorios de universidades militares latinoamericanas (ESDEG Colombia, CAEM Perú, ECEME Brasil).

2. **SIPRI**: Stockholm International Peace Research Institute — informes sobre drones militares.

3. **RAND Corporation**: Buscar manualmente en rand.org para reportes sobre UAV y operaciones de seguridad interior.

4. **JANES**: Base de datos de defensa (requiere suscripción institucional).

5. **Google Scholar manualmente**: Buscar con operadores `filetype:pdf "drones" "inteligencia militar" Paraguay`.

6. **ResearchGate**: Buscar artículos y contactar autores para solicitar acceso.

7. **CLACSO**: Para fuentes latinoamericanas sobre seguridad y defensa.

---

## Limitaciones

- No usa Sci-Hub ni sitios de acceso ilegal.
- Google Scholar no está incluido (bloquea scrapers automáticamente).
- Algunos DOIs de Crossref no tienen PDF de acceso libre.
- El campo "Relevancia para la tesis" debe completarse manualmente en el Excel.

---

## Requisitos del sistema

- Python 3.9 o superior
- Windows 10/11
- Conexión a internet
- Al menos 2 GB de espacio libre
