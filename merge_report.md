# 📚 AOSP / FUTO Dictionary Build & Lexical Audit Report
**Fecha y Hora:** `2026-08-26 22:55:16 UTC`  
**Diccionario Binario Final:** `main_es.dict`  
**Tamaño del Binario Final:** `6.57 MB` (6,891,610 bytes)  
**Total de Palabras Únicas Consolidadas (Léxico Maestro):** **`1,135,428`**  
**Total de Entradas Brutas Procesadas:** `2,193,239`  
**Entradas Léxicas Duplicadas Consolidadas:** `1,050,903` (Resueltas conservando la frecuencia más alta `max(f)`)  

---

## 🔍 1. Auditoría Detallada de Fuentes Procesadas
> **Criterio de Auditoría:** Todas las fuentes se conservan y procesan de forma 100% independiente sin descarte por similitud de nombres. La deduplicación se aplica estrictamente sobre las entradas léxicas repetidas.

| Archivo Fuente | Formato | Tamaño | Entradas Extraídas | Palabras Distintas | Aportes Exclusivos | Palabras Duplicadas (Solapadas) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `es.dic` | DIC | 815.7 KB | 71,190 | 68,517 | +12,113 | 56,404 |
| `es_PE.txt` | TXT | 698.6 KB | 58,442 | 56,027 | +0 | 56,027 |
| `es_PE_wordlist.combined` | COMBINED | 1.16 MB | 56,027 | 56,027 | +0 | 56,027 |
| `main_es (1).dict` | DICT | 1.31 MB | 235,130 | 235,130 | +205,834 | 29,296 |
| `main_es.dict` | DICT | 6.96 MB | 858,326 | 858,326 | +0 | 858,326 |
| `main_es_PE.dict` | DICT | 6.96 MB | 858,326 | 858,326 | +0 | 858,326 |
| `test.combined` | COMBINED | 0.2 KB | 5 | 5 | +2 | 3 |
| `test.dict` | DICT | 0.1 KB | 1 | 1 | +0 | 1 |
| `test1.combined` | COMBINED | 0.1 KB | 2 | 2 | +0 | 2 |
| `test1.dict` | DICT | 0.1 KB | 1 | 1 | +0 | 1 |
| `test2.combined` | COMBINED | 0.1 KB | 2 | 2 | +0 | 2 |
| `test2.dict` | DICT | 0.1 KB | 0 | 0 | +0 | 0 |
| `words_input.txt` | TXT | 976.2 KB | 55,787 | 53,967 | +2,750 | 51,217 |

### Glosario de Métricas de la Tabla:
- **Entradas Extraídas:** Número total de registros o líneas leídas en el archivo que cumplen con morfología válida.
- **Palabras Distintas:** Palabras únicas presentes dentro de ese archivo específico.
- **Aportes Exclusivos:** Palabras que **sólo** existían en este archivo y en ninguna otra fuente del repositorio.
- **Palabras Duplicadas (Solapadas):** Palabras presentes en este archivo que también existían en una o más fuentes adicionales (fusionadas bajo una sola entrada con `max(f)`).

---

## ⚙️ 2. Métricas del Árbol Trie (Compilador PtNode)
```text
Flattening the tree...
Counted nodes : 1390589
Computing addresses...
Compressing the array addresses. Original size : 10417198
(Recursively seen size : 10417198)
Compression complete in 5 passes.
After address compression : 6891482
Checking PtNode array...
Writing file...
Statistics:
  Total file size 6891482
  582201 node arrays
  1390589 PtNodes (2.3885033 PtNodes per node)
  First terminal at 0
  Last terminal at 6891470
  PtNode stats : max = 64
Done
```

---

## 🛡️ 3. Validación de Cumplimiento Técnico
- [x] **Preservación Total de Fuentes:** Ningún archivo fuente fue omitido, renombrado ni borrado.
- [x] **Deduplicación Léxica:** Cada palabra repetida se consolidó en una única entrada en `main_es.combined`.
- [x] **Resolución de Frecuencia:** Para cada colisión léxica se aplicó la frecuencia máxima ponderada (`f = max(f1, f2, ...)` en rango 1-255).
- [x] **Normalización Unicode:** Estándar NFC completo en caracteres hispanos (`á, é, í, ó, ú, ü, ñ`).
- [x] **Especificación Binaria:** Formato AOSP PtNode Trie v202 (Magic `0x9BC13AFE`).

