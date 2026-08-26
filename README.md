# Diccionario Consolidado AOSP / FUTO (Español)

Pipeline automatizado para la fusión, normalización léxica y compilación binaria de diccionarios compatibles con **AOSP**, **FUTO Keyboard**, **HeliBoard** y teclados basados en arquitectura PtNode Trie.

---

## 🚀 Pipeline Automatizado de CI/CD (GitHub Actions)

El repositorio cuenta con integración continua automática (`.github/workflows/build-dictionary.yml`). Cada vez que realizas un `push` o ejecutas manualmente el workflow desde la pestaña **Actions** (`workflow_dispatch`):

1. Se inicializa el entorno con **Java 17 (Eclipse Temurin)** y **Python 3**.
2. El script `scripts/merge_and_build_es.sh` escanea todas las fuentes en el repositorio.
3. Se extraen, desduplican y normalizan todas las palabras de:
   - Archivos binarios `.dict` existentes
   - Listas de palabras `.combined` y comprimidas `.combined.gz`
   - Diccionarios Hunspell `.dic` y listados de texto `.txt`
4. Se genera el archivo intermedio normalizado `main_es.combined`.
5. Se compila el binario Trie `main_es.dict` (y alias `main_es_PE.dict`).
6. Se genera un reporte detallado `merge_report.md` y un registro de ejecución `build.log`.
7. **Se publica automáticamente el artifact denominado `Package`** listo para su descarga e instalación directa en el teclado.

---

## 📦 Contenido del Artifact `Package`

Al finalizar cada ejecución en GitHub Actions, puedes descargar el artifact `Package` que incluye:

| Archivo | Descripción |
| :--- | :--- |
| `main_es.dict` | Diccionario binario compilado AOSP PtNode (Versión 202, Magic `0x9BC13AFE`). |
| `main_es_PE.dict` | Diccionario binario adaptado para la variante regional de Perú (`es_PE`). |
| `main_es.combined` | Lista de frecuencias consolidada en formato de texto estándar AOSP. |
| `merge_report.md` | Reporte con estadísticas de fuentes procesadas, palabras únicas y métricas del árbol Trie. |
| `build.log` | Registro completo de trazabilidad del pipeline. |

---

## 🛠️ Ejecución Local

Para compilar y fusionar manualmente en tu máquina local:

### Requisitos
- **Java JDK 17+** (OpenJDK o Temurin)
- **Python 3.8+**
- `dicttool_aosp.jar` (se descarga automáticamente si no existe)

### Comando
```bash
chmod +x scripts/merge_and_build_es.sh
./scripts/merge_and_build_es.sh
```

---

## 📂 Fuentes soportadas automáticamente
Cualquier archivo nuevo que agregues en el repositorio será detectado e integrado en la siguiente ejecución:
- `*.dict`: Diccionarios binarios existentes AOSP v2.
- `*.combined`: Archivos de pares palabra-frecuencia (`word=...,f=...`).
- `*.combined.gz`: Archivos `.combined` comprimidos en gzip.
- `*.dic`: Listados Hunspell o planos.
- `*.txt`: Listados de términos línea por línea o separados por tabuladores.
