# Diccionario Consolidado AOSP / FUTO (Español)

Pipeline automatizado de ingeniería DevOps para la fusión, auditoría léxica, desduplicación inteligente, compilación binaria y publicación automática en **GitHub Actions Artifacts** y **GitHub Releases**. Compatible con **AOSP**, **FUTO Keyboard**, **HeliBoard** y teclados con arquitectura PtNode Trie.

---

## 🚀 Flujo de Automatización CI/CD

El repositorio cuenta con un pipeline continuo en `.github/workflows/build-dictionary.yml` con dos niveles de entrega:

### 1. Push normal a cualquier rama (Generación de Artifact)
- **Disparador:** `git push` o ejecución manual desde la pestaña **Actions** (`workflow_dispatch`).
- **Resultado:** Ejecuta la auditoría léxica, fusiona las fuentes, compila los diccionarios y sube el artifact denominado **`Package`** en GitHub Actions (retención de 90 días).

### 2. Push de un Tag de Versión (Publicación Automática en GitHub Releases)
- **Disparador:** Al crear y empujar un tag semántico con prefijo `v*` (por ejemplo `v1.0.0`, `v1.1.0`):
  ```bash
  # 1. Crear el tag en tu máquina local
  git tag v1.0.0

  # 2. Empujar el tag a GitHub
  git push origin v1.0.0
  ```
- **Resultado:**
  - Se ejecuta la compilación y validación estricta de archivos no vacíos.
  - Se conserva el artifact `Package` en la ejecución de Actions.
  - **Se crea automáticamente una GitHub Release** con el nombre `Dictionary Release v1.0.0`.
  - Se suben los 5 archivos como **Assets descargables** directamente desde la sección **Releases** de GitHub.
  - El cuerpo de la release incluye la tabla completa de auditoría de fuentes, palabras únicas, tamaño del binario y trazabilidad del commit/run.

---

## 📦 Archivos Entregables (Assets y Package)

En cada Release y Artifact se incluyen exactamente los siguientes 5 archivos:

| Archivo | Formato / Tipo | Propósito |
| :--- | :---: | :--- |
| `main_es.dict` | Binario PtNode Trie (v202) | Diccionario binario consolidado principal AOSP/FUTO. |
| `main_es_PE.dict` | Binario PtNode Trie (v202) | Diccionario binario regionalizado para Perú (`es_PE`). |
| `main_es.combined` | Texto AOSP (`word=...,f=...`) | Léxico maestro unificado y desduplicado con frecuencias ponderadas. |
| `merge_report.md` | Markdown | Auditoría de fuentes, conteo de palabras exclusivas, duplicados y métricas Trie. |
| `build.log` | Texto plano | Registro de trazabilidad y salida de compilación. |

---

## 📥 Dónde Descargar los Archivos

1. **Desde GitHub Releases (Recomendado):**
   - Ve a la pestaña **Releases** en tu repositorio de GitHub: `https://github.com/<usuario>/<repositorio>/releases`.
   - Selecciona la versión deseada (ej. `v1.0.0`).
   - En la sección **Assets**, descarga directamente `main_es.dict` o `main_es_PE.dict`.

2. **Desde GitHub Actions:**
   - Ve a la pestaña **Actions** en GitHub.
   - Entra a la última ejecución del workflow **Build & Release Dictionary**.
   - En la parte inferior, descarga el archivo comprimido **`Package`**.

---

## 🎯 Política de Deduplicación y Preservación de Fuentes

1. **Preservación Total de Fuentes:**
   - **Ningún archivo fuente es eliminado ni descartado**, incluso si comparte nombres base, sufijos o variantes (`main_es.dict`, `main_es (1).dict`, `main_es_PE.dict`, `es.dic`, `es_PE.txt`, `es_PE_wordlist.combined`, `words_input.txt`, etc.).
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

## 🛠️ Ejecución Local

Para compilar y verificar manualmente en tu entorno local:

```bash
chmod +x scripts/merge_and_build_es.sh scripts/merge_and_build_es.py
./scripts/merge_and_build_es.sh
```

