#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT_TXT="$ROOT_DIR/es_PE.txt"
OUTPUT_TXT="$ROOT_DIR/es_PE_clean.txt"
OUTPUT_DICT="$ROOT_DIR/es_PE.dict"
DICTTOOL_JAR="$ROOT_DIR/dicttool_aosp.jar"
DICTTOOL_URL="${DICTTOOL_URL:-https://github.com/Helium314/HeliBoard/releases/download/v1.2/dicttool_aosp.jar}"

if [[ ! -f "$INPUT_TXT" ]]; then
  echo "No se encontró el archivo fuente: $INPUT_TXT" >&2
  exit 1
fi

if [[ ! -f "$DICTTOOL_JAR" || ! -s "$DICTTOOL_JAR" ]]; then
  echo "Descargando dicttool_aosp.jar..."
  wget -q "$DICTTOOL_URL" -O "$DICTTOOL_JAR"
fi

if [[ ! -s "$DICTTOOL_JAR" ]]; then
  echo "No se pudo obtener un dicttool_aosp.jar válido." >&2
  exit 1
fi

echo "Limpiando $INPUT_TXT -> $OUTPUT_TXT"
sed '1d' "$INPUT_TXT" | sed 's/\/[A-Z]*//g' | sed 's/$/ ,f=100/' > "$OUTPUT_TXT"

echo "Compilando diccionario binario -> $OUTPUT_DICT"
java -jar "$DICTTOOL_JAR" makedict --input "$OUTPUT_TXT" --output "$OUTPUT_DICT"

echo "Listo: $OUTPUT_DICT"