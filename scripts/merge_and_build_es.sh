#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Script de Automatización: Merge y Compilación de Diccionario AOSP / FUTO
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "==> Iniciando pipeline de fusión y compilación de diccionarios en: ${REPO_ROOT}"
cd "${REPO_ROOT}"

# Verificar que Python 3 y Java estén instalados
if ! command -v python3 &>/dev/null; then
    echo "ERROR: python3 no está instalado." >&2
    exit 1
fi

if ! command -v java &>/dev/null; then
    echo "ERROR: java no está instalado (se requiere OpenJDK 17+)." >&2
    exit 1
fi

# Ejecutar el script principal en Python
python3 "${SCRIPT_DIR}/merge_and_build_es.py"

# Validar que los artefactos requeridos existan y no estén vacíos
for f in "main_es.dict" "main_es.combined" "build.log" "merge_report.md"; do
    if [[ ! -s "${REPO_ROOT}/${f}" ]]; then
        echo "ERROR: El artefacto requerido '${f}' no existe o está vacío." >&2
        exit 1
    fi
done

echo "==> Pipeline completado exitosamente. Todos los archivos generados y validados."
