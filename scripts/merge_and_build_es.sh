#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Pipeline: Compilación de Único Diccionario Maestro AOSP / FUTO (main_es.dict)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "==> Iniciando pipeline para generar único diccionario main_es.dict en: ${REPO_ROOT}"
cd "${REPO_ROOT}"

# Verificar dependencias
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

# Validar que los artefactos finales exactos existan y no estén vacíos
for f in "main_es.dict" "main_es.combined" "build.log" "merge_report.md"; do
    if [[ ! -s "${REPO_ROOT}/${f}" ]]; then
        echo "ERROR: El artefacto requerido '${f}' no existe o está vacío." >&2
        exit 1
    fi
done

# Asegurar que no quede ningún main_es_PE.*
rm -f "${REPO_ROOT}/main_es_PE.dict" "${REPO_ROOT}/main_es_PE.combined"

echo "==> Pipeline completado exitosamente. Único diccionario final generado: main_es.dict"
