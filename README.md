# Diccionario Único Consolidado AOSP / FUTO (`main_es.dict`)

Pipeline automatizado de ingeniería DevOps para la fusión integral, auditoría léxica, desduplicación inteligente, compilación y publicación de un **único diccionario maestro final** (`main_es.dict`), compatible con **AOSP**, **FUTO Keyboard**, **HeliBoard** y teclados con arquitectura PtNode Trie.

---

## 🎯 Arquitectura del Diccionario Único

1. **Un Solo Diccionario Final:**
   - Todas las fuentes presentes en el repositorio (`.dict`, `.combined`, `.combined.gz`, `.dic`, `.txt`) se ingieren independientemente y se consolidan en un **único léxico maestro**.
   - No existen variantes regionales separadas, copias duplicadas ni diccionarios secundarios.

2. **Deduplicación Léxica y Frecuencia Máxima:**
   - Las palabras repetidas entre fuentes se unifican bajo una sola entrada conservando la frecuencia más alta detectada (`f = max(f1, f2, ...)` en rango 1-255).
   - Normalización Unicode NFC y validación morfológica estricta en español.

3. **Cabecera Estándar del Léxico Maestro (`main_es.combined`):**
   ```text
   dictionary=main:es,locale=es,description=Spanish merged dictionary,date=UNIX_TIMESTAMP,version=1
   ```

4. **Entregables Finales:**
   - **Diccionario Binario Final:** `main_es.dict` (PtNode Trie v202)
   - **Fuente Intermedia Maestra:** `main_es.combined`
   - **Auditoría Léxica:** `merge_report.md`
   - **Log de Compilación:** `build.log`

---

## 🚀 Flujo de Automatización CI/CD (GitHub Actions)

El workflow `.github/workflows/build-dictionary.yml` opera en dos modalidades:

### 1. Push a cualquier rama (Generación de Artifact)
- **Disparador:** `git push` o ejecución manual (`workflow_dispatch`).
- **Resultado:** Ejecuta la fusión total, compila `main_es.dict` y sube el artifact **`Package`** en GitHub Actions.

### 2. Push de Tag de Versión (Publicación Automática en GitHub Releases)
- **Disparador:** Al crear y empujar un tag semántico con prefijo `v*` (ejemplo `v1.0.0`):
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```
- **Resultado:**
  - Compila y valida la integridad de `main_es.dict` y `main_es.combined`.
  - **Crea automáticamente una GitHub Release** titulada `Dictionary Release v1.0.0`.
  - Adjunta los 4 assets descargables (`main_es.dict`, `main_es.combined`, `merge_report.md`, `build.log`).
  - Publica la auditoría léxica en la descripción de la release.

---

## 📦 Contenido del Artifact `Package` y Assets de Release

| Archivo | Formato / Tipo | Descripción |
| :--- | :---: | :--- |
| **`main_es.dict`** | Binario PtNode Trie (v202) | Único diccionario binario consolidado final. |
| **`main_es.combined`** | Texto AOSP (`word=...,f=...`) | Única fuente intermedia con el 100% de palabras consolidadas. |
| **`merge_report.md`** | Markdown | Auditoría de fuentes, conteo de palabras exclusivas y duplicados. |
| **`build.log`** | Texto plano | Log de compilación y trazabilidad de GitHub Actions. |

---

## 🛠️ Ejecución y Compilación Local

```bash
chmod +x scripts/merge_and_build_es.sh scripts/merge_and_build_es.py
./scripts/merge_and_build_es.sh
```
