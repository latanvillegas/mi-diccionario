# 📚 AOSP / FUTO Consolidated Single Master Dictionary Report
**Fecha y Hora:** `2026-08-26 23:32:11 UTC`  
**Único Diccionario Final (Master Binary):** **`main_es.dict`**  
**Única Fuente Intermedia Maestra:** **`main_es.combined`**  
**Locale Configurado:** `es` (Español)  
**Tamaño del Binario Final (`main_es.dict`):** `6.31 MB` (6,613,998 bytes)  
**SHA-256 de `main_es.dict`:** `3ce4a5c7166a796f129adfdbd1dcbdfb39d2a8bf6cb2c08c48196e4e058e3051`  
**Total de Palabras Únicas Consolidadas en el Diccionario Final:** **`1,097,942`**  
**Total de Entradas Brutas Procesadas:** `2,672,473`  
**Entradas Léxicas Duplicadas Consolidadas:** `1,567,623` (Resueltas conservando la frecuencia más alta `max(f)`)  

### 🏷️ Trazabilidad de GitHub Actions:
- **GitHub Run ID:** `Local / CI Workspace`
- **GitHub Run Number:** `#1` (Intento: `1`)
- **Commit SHA:** `HEAD (Uncommitted)`
- **Run URL:** `Local execution`

---

## 🔍 1. Auditoría de Fuentes Fusionadas en el Diccionario Único
> **Criterio de Fusión:** Todas las fuentes del repositorio se ingirieron de forma 100% independiente y se consolidaron en un solo léxico maestro. Las palabras duplicadas se resolvieron conservando la frecuencia más alta `max(f)`.

| Archivo Fuente | Formato | Tamaño | Entradas Extraídas | Palabras Distintas | Aportes Exclusivos | Palabras Duplicadas (Solapadas) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `es.dic` | DIC | 815.7 KB | 71,190 | 68,517 | +0 | 68,517 |
| `es_PE.txt` | TXT | 698.6 KB | 58,442 | 56,027 | +0 | 56,027 |
| `es_PE_wordlist.combined` | COMBINED | 1.16 MB | 56,027 | 56,027 | +0 | 56,027 |
| `main_es (1).dict` | DICT | 1.31 MB | 235,130 | 235,130 | +0 | 235,130 |
| `main_es.combined` | COMBINED | 44.20 MB | 1,097,942 | 1,097,942 | +0 | 1,097,942 |
| `main_es.dict` | DICT | 6.31 MB | 1 | 1 | +0 | 1 |
| `main_es_PE.combined` | COMBINED | 44.20 MB | 1,097,942 | 1,097,942 | +0 | 1,097,942 |
| `main_es_PE.dict` | DICT | 6.31 MB | 1 | 1 | +0 | 1 |
| `test.combined` | COMBINED | 0.2 KB | 5 | 5 | +0 | 5 |
| `test.dict` | DICT | 0.1 KB | 1 | 1 | +0 | 1 |
| `test1.combined` | COMBINED | 0.1 KB | 2 | 2 | +0 | 2 |
| `test1.dict` | DICT | 0.1 KB | 1 | 1 | +0 | 1 |
| `test2.combined` | COMBINED | 0.1 KB | 2 | 2 | +0 | 2 |
| `test2.dict` | DICT | 0.1 KB | 0 | 0 | +0 | 0 |
| `words_input.txt` | TXT | 976.2 KB | 55,787 | 53,967 | +0 | 53,967 |

### Glosario de Métricas de la Tabla:
- **Entradas Extraídas:** Número total de registros o líneas leídas en el archivo que cumplen con morfología válida.
- **Palabras Distintas:** Palabras únicas presentes dentro de ese archivo específico.
- **Aportes Exclusivos:** Palabras que **sólo** existían en este archivo y en ninguna otra fuente del repositorio.
- **Palabras Duplicadas (Solapadas):** Palabras presentes en este archivo que también existían en una o más fuentes adicionales (fusionadas bajo una sola entrada con `max(f)`).

---

## ⚙️ 2. Métricas del Árbol PtNode Trie (`main_es.dict`)
```text
Flattening the tree...
Counted nodes : 1337091
Computing addresses...
Compressing the array addresses. Original size : 10000941
(Recursively seen size : 10000941)
Compression complete in 5 passes.
After address compression : 6613893
Checking PtNode array...
Writing file...
Statistics:
  Total file size 6613893
  562999 node arrays
  1337091 PtNodes (2.3749437 PtNodes per node)
  First terminal at 0
  Last terminal at 6613881
  PtNode stats : max = 64
Done
```

---

## 🛡️ 3. Validación de Cumplimiento Técnico
- [x] **Un Solo Diccionario Final:** Generado exclusivamente `main_es.dict`.
- [x] **Sin Variantes Regionales Separadas:** Configurado con locale unificado `es`.
- [x] **Deduplicación Léxica:** Cada palabra repetida se consolidó en una única entrada en `main_es.combined`.
- [x] **Resolución de Frecuencia:** Para cada colisión léxica se aplicó la frecuencia máxima ponderada (`f = max(f1, f2, ...)` en rango 1-255).
- [x] **Normalización Unicode:** Estándar NFC completo en caracteres hispanos (`á, é, í, ó, ú, ü, ñ`).
- [x] **Especificación Binaria:** Formato AOSP PtNode Trie v202 (Magic `0x9BC13AFE`).

