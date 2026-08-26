# AOSP / FUTO Dictionary Build & Merge Report
**Generated on:** 2026-08-26 22:29:52 UTC  
**Target Binary:** `main_es.dict`  
**Final Dictionary Size:** 8.24 MB (8,640,190 bytes)  
**Total Consolidated Unique Words:** 1,460,131  

## 1. Processed Source Files
| Source File | Format | File Size | Raw Entries | New Unique Words | Lexicon Pool |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `es.dic` | DIC | 815.7 KB | 71,199 | +68,517 | 68,517 |
| `es_PE.txt` | TXT | 698.6 KB | 58,445 | +0 | 68,517 |
| `es_PE_wordlist.combined` | COMBINED | 1.16 MB | 56,030 | +0 | 68,517 |
| `main_es (1).dict` | DICT | 1.31 MB | 236,227 | +234,507 | 303,024 |
| `main_es.dict` | DICT | 6.73 MB | 1,186,132 | +1,157,105 | 1,460,129 |
| `main_es_PE.dict` | DICT | 6.73 MB | 1,186,132 | +0 | 1,460,129 |
| `test.combined` | COMBINED | 0.2 KB | 5 | +2 | 1,460,131 |
| `test.dict` | DICT | 0.1 KB | 4 | +0 | 1,460,131 |
| `test1.combined` | COMBINED | 0.1 KB | 2 | +0 | 1,460,131 |
| `test1.dict` | DICT | 0.1 KB | 3 | +0 | 1,460,131 |
| `test2.combined` | COMBINED | 0.1 KB | 2 | +0 | 1,460,131 |
| `test2.dict` | DICT | 0.1 KB | 0 | +0 | 1,460,131 |
| `words_input.txt` | TXT | 976.2 KB | 58,444 | +0 | 1,460,131 |

## 2. Compilation & Trie Tree Metrics
```text
Flattening the tree...
Counted nodes : 1734216
Computing addresses...
Compressing the array addresses. Original size : 13065469
(Recursively seen size : 13065469)
Compression complete in 6 passes.
After address compression : 8640062
Checking PtNode array...
Writing file...
Statistics:
  Total file size 8640062
  699748 node arrays
  1734216 PtNodes (2.4783437 PtNodes per node)
  First terminal at 0
  Last terminal at 8640050
  PtNode stats : max = 64
Done
```

## 3. Verification & Compliance
- [x] **Format Spec:** AOSP / FUTO PtNode Trie (Version 202, Magic `0x9BC13AFE`)
- [x] **Unicode Normalization:** NFC Standard compliant
- [x] **Deduplication:** Automatic collision resolution keeping highest probability
- [x] **Non-empty Output:** Validated

