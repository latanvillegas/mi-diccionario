#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT_TXT="${1:-$ROOT_DIR/es_PE.txt}"
COMBINED_FILE="$ROOT_DIR/es_PE_wordlist.combined"
OUTPUT_DICT="$ROOT_DIR/main_es_PE.dict"
DICTTOOL_JAR="$ROOT_DIR/dicttool_aosp.jar"
DICTTOOL_URL="https://github.com/remi0s/aosp-dictionary-tools/raw/master/dicttool_aosp.jar"

echo "=== Pipeline de Compilación AOSP / FUTO Dictionary (es_PE) ==="

if [[ ! -f "$INPUT_TXT" ]]; then
  echo "Error: No se encontró el archivo fuente: $INPUT_TXT" >&2
  exit 1
fi

# Ensure dicttool_aosp.jar exists and is valid
if [[ ! -f "$DICTTOOL_JAR" || ! -s "$DICTTOOL_JAR" ]]; then
  echo "Descargando dicttool_aosp.jar..."
  curl -fsSL -o "$DICTTOOL_JAR" "$DICTTOOL_URL" || wget -q "$DICTTOOL_URL" -O "$DICTTOOL_JAR"
fi

echo "1. Generando archivo de formato combinado: $INPUT_TXT -> $COMBINED_FILE"
node -e "
const fs = require('fs');
const inputFile = process.argv[1];
const combinedFile = process.argv[2];

const lines = fs.readFileSync(inputFile, 'utf8').split(/\r?\n/);
const seen = new Set();
const words = [];

// Header standard for AOSP LatinIME / FUTO
const header = [
  'dictionary=main:es_PE,locale=es_PE,description=Spanish (Peru) Dictionary for FUTO / AOSP,date=' + Math.floor(Date.now() / 1000) + ',version=1'
];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || (i === 0 && /^\d+$/.test(line))) continue;
  
  // Clean Hunspell flags like /AS, /S
  const clean = line.split('/')[0].trim();
  if (!clean || seen.has(clean) || /^\d+$/.test(clean)) continue;
  seen.add(clean);
  words.push(clean);
}

// Sort alphabetically
words.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'case' }));

const entries = words.map(w => ' word=' + w + ',f=100');
const output = header.concat(entries).join('\n') + '\n';
fs.writeFileSync(combinedFile, output, 'utf8');
console.log('   Total palabras procesadas:', words.length);
" "$INPUT_TXT" "$COMBINED_FILE"

echo "2. Compilando diccionario binario final:"
echo "   java -jar $DICTTOOL_JAR makedict -s $COMBINED_FILE -d $OUTPUT_DICT"
java -jar "$DICTTOOL_JAR" makedict -s "$COMBINED_FILE" -d "$OUTPUT_DICT"

echo "=== Compilación exitosa ==="
echo "Archivo binario generado: $OUTPUT_DICT ($(stat -c%s "$OUTPUT_DICT" 2>/dev/null || stat -f%z "$OUTPUT_DICT" 2>/dev/null) bytes)"
