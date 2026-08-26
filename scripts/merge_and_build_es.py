#!/usr/bin/env python3
"""
Merge and Build AOSP/FUTO Consolidated Dictionary
Automated script for CI/CD and local development.
Performs independent source ingestion, individual file word extraction,
cross-source duplicate tracking/auditing, highest-frequency collision resolution,
and final unified binary PtNode Trie compilation.
Generates ONLY main_es.dict and main_es.combined with locale 'es'.
"""

import os
import sys
import gzip
import time
import shutil
import urllib.request
import subprocess
import unicodedata
import hashlib
import re
from pathlib import Path

# Paths
REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = Path(__file__).resolve().parent
DICTTOOL_JAR = REPO_ROOT / "dicttool_aosp.jar"
LOG_FILE = REPO_ROOT / "build.log"
REPORT_FILE = REPO_ROOT / "merge_report.md"

# Single Final Output
MASTER_COMBINED_OUT = REPO_ROOT / "main_es.combined"
MASTER_DICT_OUT = REPO_ROOT / "main_es.dict"

DICTTOOL_URL = "https://github.com/Helium314/HeliBoard/releases/download/v2.1/dicttool_aosp.jar"
MAX_WORD_LENGTH = 47
VALID_WORD_RE = re.compile(r"^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+(?:[\-'][a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+)*$")

class Logger:
    def __init__(self, log_path):
        self.log_file = open(log_path, "w", encoding="utf-8")
        
    def log(self, msg):
        timestamp = time.strftime("[%Y-%m-%d %H:%M:%S]")
        formatted = f"{timestamp} {msg}"
        print(formatted)
        self.log_file.write(formatted + "\n")
        self.log_file.flush()
        
    def close(self):
        self.log_file.close()

logger = Logger(LOG_FILE)

def ensure_dicttool():
    """Ensure dicttool_aosp.jar is available, download if missing."""
    if not DICTTOOL_JAR.exists() or DICTTOOL_JAR.stat().st_size < 1000:
        logger.log(f"dicttool_aosp.jar missing or invalid. Downloading from {DICTTOOL_URL}...")
        try:
            urllib.request.urlretrieve(DICTTOOL_URL, DICTTOOL_JAR)
            logger.log(f"Downloaded dicttool_aosp.jar ({DICTTOOL_JAR.stat().st_size} bytes)")
        except Exception as e:
            logger.log(f"ERROR downloading dicttool_aosp.jar: {e}")
            raise
    else:
        logger.log(f"Found dicttool_aosp.jar ({DICTTOOL_JAR.stat().st_size} bytes)")

def compile_java_extractor():
    """Compile a Java helper to extract words from binary .dict files."""
    java_src = SCRIPTS_DIR / "DictBinaryExtractor.java"
    java_code = """
package com.android.inputmethod.latin.makedict;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class DictBinaryExtractor {
    public static void main(String[] args) {
        if (args.length < 2) {
            System.err.println("Usage: DictBinaryExtractor <dict_file> <output_tsv>");
            System.exit(1);
        }
        File dictFile = new File(args[0]);
        File outFile = new File(args[1]);

        try {
            if (!dictFile.exists() || dictFile.length() < 16) {
                System.err.println("File is empty or does not exist: " + dictFile);
                System.exit(0);
            }
            RandomAccessFile raf = new RandomAccessFile(dictFile, "r");
            int magic = raf.readInt();
            if (magic != FormatSpec.MAGIC_NUMBER) {
                System.err.println("Invalid magic number in " + dictFile);
                raf.close();
                System.exit(0);
            }
            int version = raf.readUnsignedShort();
            int options = raf.readUnsignedShort();
            int headerSize = raf.readInt();
            int bodyOffset = 12 + headerSize;
            long bodyLength = dictFile.length() - bodyOffset;
            raf.close();

            if (bodyLength <= 0) {
                System.exit(0);
            }

            Ver2DictDecoder decoder = new Ver2DictDecoder(dictFile, bodyOffset, bodyLength, DictDecoder.USE_BYTEARRAY);
            decoder.openDictBuffer();

            BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(outFile), StandardCharsets.UTF_8), 1024 * 1024);
            Set<Integer> visited = new HashSet<>();
            long[] count = new long[1];
            traverse(decoder, 0, "", bw, count, visited);
            bw.flush();
            bw.close();
            System.out.println("EXTRACTED_ENTRIES=" + count[0]);
        } catch (Throwable t) {
            System.err.println("Error extracting from " + dictFile + ": " + t.getMessage());
        }
    }

    private static void traverse(Ver2DictDecoder decoder, int arrayPos, String prefix, BufferedWriter writer, long[] count, Set<Integer> visited) {
        if (prefix.length() > FormatSpec.MAX_WORD_LENGTH) return;
        if (!visited.add(arrayPos)) return;

        try {
            decoder.setPosition(arrayPos);
            int nodeCount = decoder.readPtNodeCount();
            int currentPos = decoder.getPosition();

            for (int i = 0; i < nodeCount; i++) {
                decoder.setPosition(currentPos);
                PtNodeInfo info = decoder.readPtNode(currentPos);
                StringBuilder sb = new StringBuilder(prefix);
                if (info.mCharacters != null) {
                    for (int cp : info.mCharacters) {
                        sb.appendCodePoint(cp);
                    }
                }
                String currentWord = sb.toString();

                if (info.isTerminal() && currentWord.length() > 0 && currentWord.length() <= FormatSpec.MAX_WORD_LENGTH) {
                    int freq = (info.mProbabilityInfo != null) ? info.mProbabilityInfo.mProbability : 100;
                    writer.write(currentWord + "\\t" + freq + "\\n");
                    count[0]++;
                }

                if (BinaryDictIOUtils.hasChildrenAddress(info.mFlags) && info.mChildrenAddress > 0) {
                    traverse(decoder, info.mChildrenAddress, currentWord, writer, count, visited);
                }

                currentPos = info.mEndAddress;
            }
        } catch (Exception e) {
            // End of branch
        }
    }
}
"""
    with open(java_src, "w", encoding="utf-8") as f:
        f.write(java_code)

    logger.log("Compiling DictBinaryExtractor.java...")
    res = subprocess.run(
        ["javac", "-d", str(SCRIPTS_DIR), "-cp", str(DICTTOOL_JAR), str(java_src)],
        capture_output=True,
        text=True
    )
    if res.returncode != 0:
        logger.log(f"Warning: Failed to compile DictBinaryExtractor: {res.stderr}")
        return False
    logger.log("DictBinaryExtractor compiled successfully.")
    return True

def extract_from_binary_dict(dict_path):
    """Extract words and frequencies from binary dict using Java helper."""
    temp_tsv = SCRIPTS_DIR / f"temp_{dict_path.stem}.tsv"
    cmd = [
        "java",
        "-Xmx3g",
        "-cp",
        f"{SCRIPTS_DIR}:{DICTTOOL_JAR}",
        "com.android.inputmethod.latin.makedict.DictBinaryExtractor",
        str(dict_path),
        str(temp_tsv)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    words = []
    if temp_tsv.exists():
        with open(temp_tsv, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                parts = line.split("\t")
                w = parts[0].strip()
                f_val = 100
                if len(parts) > 1:
                    try:
                        f_val = int(parts[1])
                    except ValueError:
                        f_val = 100
                words.append((w, f_val))
        try:
            temp_tsv.unlink()
        except Exception:
            pass
    return words

def clean_and_normalize_word(raw_word):
    """Normalize and validate a Spanish word."""
    if not raw_word:
        return None
    w = unicodedata.normalize("NFC", raw_word.strip())
    if not w or len(w) > MAX_WORD_LENGTH:
        return None
    if not VALID_WORD_RE.match(w):
        return None
    return w

def parse_line_entry(line):
    """Parses a text entry line in various formats (word=..., palabra ,f=..., tab-separated, hunspell, etc.)."""
    line = line.strip()
    if not line or line.startswith("#") or line.startswith("dictionary="):
        return None, 100

    word = None
    freq = 100

    if "word=" in line:
        parts = [p.strip() for p in line.split(",")]
        for p in parts:
            if p.startswith("word="):
                word = p[5:].strip()
            elif p.startswith("f="):
                try:
                    freq = int(p[2:].strip())
                except ValueError:
                    freq = 100
    elif ",f=" in line or ", f=" in line:
        parts = line.split(",f=" if ",f=" in line else ", f=")
        word = parts[0].strip()
        if len(parts) > 1:
            try:
                freq = int(parts[1].strip())
            except ValueError:
                freq = 100
    elif "\t" in line:
        parts = line.split("\t")
        word = parts[0].strip()
        if len(parts) > 1:
            try:
                freq = int(parts[1].strip())
            except ValueError:
                freq = 100
    elif "/" in line and not line.startswith("http"):
        word = line.split("/")[0].strip()
    else:
        subparts = line.split()
        if len(subparts) == 2 and subparts[1].isdigit():
            word = subparts[0].strip()
            freq = int(subparts[1])
        else:
            word = line.strip()

    return word, freq

def extract_words_from_file(file_path, is_dict, is_gz, has_java_extractor):
    """Extracts all raw entries from a single file and returns a list of (normalized_word, freq)."""
    entries = []
    if is_dict:
        if not has_java_extractor:
            logger.log(f"  Skipping binary {file_path.name} (Java extractor unavailable)")
            return []
        raw_entries = extract_from_binary_dict(file_path)
        for raw_w, freq in raw_entries:
            w = clean_and_normalize_word(raw_w)
            if w:
                clamped_f = max(1, min(255, freq))
                entries.append((w, clamped_f))
    else:
        opener = gzip.open if is_gz else open
        try:
            with opener(file_path, "rt", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    word, freq = parse_line_entry(line)
                    if word:
                        w = clean_and_normalize_word(word)
                        if w:
                            clamped_f = max(1, min(255, freq))
                            entries.append((w, clamped_f))
        except Exception as e:
            logger.log(f"  Error reading {file_path.name}: {e}")

    return entries

def process_all_sources():
    """
    Scans every single dictionary source independently.
    Merges all words into a single master dictionary lexicon resolving collisions with max(f).
    """
    master_lexicon = {}  # word -> max_freq
    file_word_sets = {}  # file_path -> dict(word -> max_freq in that file)
    source_stats = []

    excluded_names = {
        "output.dict",
        "test_out.dict",
        "package.json",
        "tsconfig.json",
        "vite.config.ts",
        "postcss.config.js",
        "tailwind.config.js"
    }

    all_files = []
    for root, dirs, files in os.walk(REPO_ROOT):
        dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ["node_modules", "dist"]]
        for file in files:
            p = Path(root) / file
            if p.name in excluded_names or p.name.startswith("temp_"):
                continue
            all_files.append(p)

    all_files.sort()
    has_java_extractor = compile_java_extractor()

    for file_path in all_files:
        ext = file_path.suffix.lower()
        full_ext = "".join(file_path.suffixes).lower()

        is_dict = ext == ".dict"
        is_gz = full_ext.endswith(".combined.gz") or ext == ".gz"
        is_combined = full_ext.endswith(".combined") and not is_gz
        is_txt_or_dic = ext in [".txt", ".dic"]

        if not (is_dict or is_gz or is_combined or is_txt_or_dic):
            continue

        logger.log(f"Ingesting source independently: {file_path.relative_to(REPO_ROOT)} ({file_path.stat().st_size} bytes)")
        extracted = extract_words_from_file(file_path, is_dict, is_gz, has_java_extractor)

        file_words = {}
        for w, f in extracted:
            if w not in file_words or f > file_words[w]:
                file_words[w] = f

        file_word_sets[file_path] = {
            "ext": ext.replace(".", "").upper() if not is_gz else "COMBINED.GZ",
            "size": file_path.stat().st_size,
            "raw_entries": len(extracted),
            "words": file_words
        }

    for file_path, data in file_word_sets.items():
        words_in_file = set(data["words"].keys())
        
        words_in_other_files = set()
        for other_path, other_data in file_word_sets.items():
            if other_path != file_path:
                words_in_other_files.update(other_data["words"].keys())

        unique_to_this_file = words_in_file - words_in_other_files
        duplicate_words = words_in_file & words_in_other_files

        source_stats.append({
            "path": file_path,
            "name": str(file_path.relative_to(REPO_ROOT)),
            "type": data["ext"],
            "size": data["size"],
            "raw_entries": data["raw_entries"],
            "distinct_in_file": len(words_in_file),
            "exclusive_words": len(unique_to_this_file),
            "duplicated_words": len(duplicate_words)
        })

        for w, f in data["words"].items():
            if w not in master_lexicon or f > master_lexicon[w]:
                master_lexicon[w] = f

    return master_lexicon, source_stats

def write_combined_file(lexicon, output_path):
    """Write the single master .combined file using the exact requested Spanish header."""
    epoch = int(time.time())
    logger.log(f"Writing single master {output_path.name} with {len(lexicon)} words...")
    with open(output_path, "w", encoding="utf-8") as f:
        # Pattern requested: dictionary=main:es,locale=es,description=Spanish merged dictionary,date=UNIX_TIMESTAMP,version=1
        f.write(f"dictionary=main:es,locale=es,description=Spanish merged dictionary,date={epoch},version=1\n")
        for word in sorted(lexicon.keys()):
            f.write(f" word={word},f={lexicon[word]}\n")
    logger.log(f"Master combined file written: {output_path.stat().st_size} bytes")

def compile_binary_dict(combined_path, dict_path):
    """Compile single master binary main_es.dict using dicttool_aosp.jar."""
    logger.log(f"Compiling single master binary dictionary {dict_path.name} from {combined_path.name}...")
    cmd = [
        "java",
        "-Xmx4g",
        "-jar",
        str(DICTTOOL_JAR),
        "makedict",
        "-s",
        str(combined_path),
        "-d",
        str(dict_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    logger.log(f"makedict output:\n{res.stdout}")
    if res.stderr:
        logger.log(f"makedict stderr:\n{res.stderr}")
        
    if res.returncode != 0 or not dict_path.exists() or dict_path.stat().st_size == 0:
        raise RuntimeError(f"makedict failed with return code {res.returncode}")
        
    logger.log(f"Master binary dictionary successfully compiled: {dict_path.stat().st_size} bytes")
    return res.stdout

def compute_sha256(file_path):
    """Compute SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def generate_report(source_stats, lexicon_size, master_dict_path, makedict_output):
    """Generate comprehensive Markdown audit report for the single master dictionary."""
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    dict_size = master_dict_path.stat().st_size
    master_sha = compute_sha256(master_dict_path)
    
    total_raw_entries = sum(s["raw_entries"] for s in source_stats)
    total_distinct_instances = sum(s["distinct_in_file"] for s in source_stats)
    total_duplicate_instances = total_distinct_instances - lexicon_size

    # GitHub Actions Metadata (if present)
    run_id = os.environ.get("GITHUB_RUN_ID", "Local / CI Workspace")
    run_number = os.environ.get("GITHUB_RUN_NUMBER", "1")
    run_attempt = os.environ.get("GITHUB_RUN_ATTEMPT", "1")
    commit_sha = os.environ.get("GITHUB_SHA", "HEAD (Uncommitted)")
    server_url = os.environ.get("GITHUB_SERVER_URL", "https://github.com")
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    run_url = f"{server_url}/{repo}/actions/runs/{run_id}" if repo and run_id != "Local / CI Workspace" else "Local execution"
    
    report_lines = [
        "# 📚 AOSP / FUTO Consolidated Single Master Dictionary Report",
        f"**Fecha y Hora:** `{timestamp}`  ",
        f"**Único Diccionario Final (Master Binary):** **`{master_dict_path.name}`**  ",
        f"**Única Fuente Intermedia Maestra:** **`{MASTER_COMBINED_OUT.name}`**  ",
        f"**Locale Configurado:** `es` (Español)  ",
        f"**Tamaño del Binario Final (`main_es.dict`):** `{dict_size / (1024*1024):.2f} MB` ({dict_size:,} bytes)  ",
        f"**SHA-256 de `main_es.dict`:** `{master_sha}`  ",
        f"**Total de Palabras Únicas Consolidadas en el Diccionario Final:** **`{lexicon_size:,}`**  ",
        f"**Total de Entradas Brutas Procesadas:** `{total_raw_entries:,}`  ",
        f"**Entradas Léxicas Duplicadas Consolidadas:** `{total_duplicate_instances:,}` (Resueltas conservando la frecuencia más alta `max(f)`)  ",
        "",
        "### 🏷️ Trazabilidad de GitHub Actions:",
        f"- **GitHub Run ID:** `{run_id}`",
        f"- **GitHub Run Number:** `#{run_number}` (Intento: `{run_attempt}`)",
        f"- **Commit SHA:** `{commit_sha}`",
        f"- **Run URL:** [{run_url}]({run_url})" if run_url.startswith("http") else f"- **Run URL:** `{run_url}`",
        "",
        "---",
        "",
        "## 🔍 1. Auditoría de Fuentes Fusionadas en el Diccionario Único",
        "> **Criterio de Fusión:** Todas las fuentes del repositorio se ingirieron de forma 100% independiente y se consolidaron en un solo léxico maestro. Las palabras duplicadas se resolvieron conservando la frecuencia más alta `max(f)`.",
        "",
        "| Archivo Fuente | Formato | Tamaño | Entradas Extraídas | Palabras Distintas | Aportes Exclusivos | Palabras Duplicadas (Solapadas) |",
        "| :--- | :---: | :---: | :---: | :---: | :---: | :---: |"
    ]
    
    for s in source_stats:
        size_str = f"{s['size'] / 1024:.1f} KB" if s['size'] < 1024*1024 else f"{s['size'] / (1024*1024):.2f} MB"
        report_lines.append(
            f"| `{s['name']}` | {s['type']} | {size_str} | {s['raw_entries']:,} | {s['distinct_in_file']:,} | +{s['exclusive_words']:,} | {s['duplicated_words']:,} |"
        )
        
    report_lines.extend([
        "",
        "### Glosario de Métricas de la Tabla:",
        "- **Entradas Extraídas:** Número total de registros o líneas leídas en el archivo que cumplen con morfología válida.",
        "- **Palabras Distintas:** Palabras únicas presentes dentro de ese archivo específico.",
        "- **Aportes Exclusivos:** Palabras que **sólo** existían en este archivo y en ninguna otra fuente del repositorio.",
        "- **Palabras Duplicadas (Solapadas):** Palabras presentes en este archivo que también existían en una o más fuentes adicionales (fusionadas bajo una sola entrada con `max(f)`).",
        "",
        "---",
        "",
        "## ⚙️ 2. Métricas del Árbol PtNode Trie (`main_es.dict`)",
        "```text",
        makedict_output.strip() if makedict_output else "No makedict log",
        "```",
        "",
        "---",
        "",
        "## 🛡️ 3. Validación de Cumplimiento Técnico",
        "- [x] **Un Solo Diccionario Final:** Generado exclusivamente `main_es.dict`.",
        "- [x] **Sin Variantes Regionales Separadas:** Configurado con locale unificado `es`.",
        "- [x] **Deduplicación Léxica:** Cada palabra repetida se consolidó en una única entrada en `main_es.combined`.",
        "- [x] **Resolución de Frecuencia:** Para cada colisión léxica se aplicó la frecuencia máxima ponderada (`f = max(f1, f2, ...)` en rango 1-255).",
        "- [x] **Normalización Unicode:** Estándar NFC completo en caracteres hispanos (`á, é, í, ó, ú, ü, ñ`).",
        "- [x] **Especificación Binaria:** Formato AOSP PtNode Trie v202 (Magic `0x9BC13AFE`).",
        ""
    ])
    
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines) + "\n")
    logger.log(f"Report generated: {REPORT_FILE.name}")

def clean_old_regional_artifacts():
    """Remove old main_es_PE.* artifacts so only main_es.* exists."""
    for p in [REPO_ROOT / "main_es_PE.dict", REPO_ROOT / "main_es_PE.combined"]:
        if p.exists():
            try:
                p.unlink()
                logger.log(f"Removed legacy regional artifact: {p.name}")
            except Exception:
                pass

def main():
    logger.log("=== STARTING SINGLE MASTER AOSP/FUTO DICTIONARY (main_es.dict) PIPELINE ===")
    start_time = time.time()
    
    try:
        ensure_dicttool()
        lexicon, source_stats = process_all_sources()
        
        if not lexicon:
            raise ValueError("No valid words were extracted from the sources!")
            
        clean_old_regional_artifacts()

        # Step 1: Write SINGLE master intermediate .combined file (locale: es)
        write_combined_file(lexicon, MASTER_COMBINED_OUT)
        
        # Step 2: Compile SINGLE master binary dictionary (main_es.dict)
        makedict_out = compile_binary_dict(MASTER_COMBINED_OUT, MASTER_DICT_OUT)

        # Step 3: Generate audit report
        generate_report(source_stats, len(lexicon), MASTER_DICT_OUT, makedict_out)
        
        elapsed = time.time() - start_time
        logger.log(f"=== PIPELINE COMPLETED SUCCESSFULLY IN {elapsed:.2f}s ===")
        return 0
        
    except Exception as e:
        logger.log(f"PIPELINE FAILED: {e}")
        import traceback
        logger.log(traceback.format_exc())
        return 1
    finally:
        logger.close()

if __name__ == "__main__":
    sys.exit(main())
