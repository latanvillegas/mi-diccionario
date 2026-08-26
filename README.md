# Diccionario Consolidado AOSP / FUTO (Español)

Pipeline automatizado para la fusión, auditoría léxica, desduplicación inteligente y compilación binaria de diccionarios compatibles con **AOSP**, **FUTO Keyboard**, **HeliBoard** y motores basados en arquitectura PtNode Trie.

---

## 🎯 Política de Deduplicación y Preservación de Fuentes

1. **Preservación Total de Fuentes:**
   - **Ningún archivo fuente es eliminado ni descartado**, incluso si comparte nombres base, sufijos o variantes (`main_es.dict`, `main_es (1).dict`, `main_es_PE.dict`, `es.dic`, `es_PE.txt`, `es_PE_wordlist.combined`, etc.).
   - Cada archivo fuente en el repositorio se escanea y procesa de forma 100% independiente.

2. **Deduplicación Estrictamente Léxica:**
   - La deduplicación se realiza sobre las **palabras y entradas repetidas** dentro del contenido acumulado de todos los archivos.
   - Si una palabra aparece en múltiples fuentes, se preserva una sola entrada consolidada en el diccionario final.
   - **Resolución de Frecuencias:** Si la misma palabra presenta frecuencias diferentes en distintas fuentes, se conserva la **frecuencia más alta** (`f = max(f1, f2, ...)` en el rango estándar $1-255$).

3. **Auditoría Transparente por Archivo:**
   - En cada compilación se genera una tabla de auditoría detallada en `merge_report.md` que desglosa:
     - Archivo fuente procesado y formato.
     - Cantidad total de entradas extraídas.
     - Palabras distintas contenidas en el archivo.
     - Cantidad de palabras exclusivas aportadas por ese archivo.
     - Cantidad de palabras que resultaron solapadas/duplicadas respecto a las demás fuentes.

---

## 🚀 Pipeline Automatizado de CI/CD (GitHub Actions)

El workflow `.github/workflows/build-dictionary.yml` se ejecuta automáticamente en cada `push` o ejecución manual (`workflow_dispatch`):

1. Configura el entorno con **Java 17 (Eclipse Temurin)** y **Python 3**.
2. Ejecuta `scripts/merge_and_build_es.sh` para procesar todas las fuentes del repositorio.
3. Extrae todas las palabras, ejecuta la matriz de auditoría y aplica normalización Unicode NFC.
4. Genera el archivo maestro intermedio `main_es.combined`.
5. Compila el binario Trie `main_es.dict` (y su alias `main_es_PE.dict`).
6. Publica la auditoría en el resumen de GitHub Actions (`$GITHUB_STEP_SUMMARY`).
7. **Empaqueta y sube el artifact denominado `Package`** para su descarga directa.

---

## 📦 Contenido del Artifact `Package`

| Archivo | Descripción |
| :--- | :--- |
| `main_es.dict` | Diccionario binario compilado AOSP PtNode (Versión 202, Magic `0x9BC13AFE`). |
| `main_es_PE.dict` | Diccionario binario adaptado para la variante regional de Perú (`es_PE`). |
| `main_es.combined` | Léxico consolidado desduplicado en formato de texto AOSP (`word=...,f=...`). |
| `merge_report.md` | Reporte con auditoría detallada de fuentes, métricas de solapamiento y árbol Trie. |
| `build.log` | Registro cronológico completo de la ejecución del pipeline. |

---

## 🛠️ Ejecución Local

```bash
chmod +x scripts/merge_and_build_es.sh scripts/merge_and_build_es.py
./scripts/merge_and_build_es.sh
```
