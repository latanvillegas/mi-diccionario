# mi-diccionario

Repositorio para convertir el lexicón [es_PE.txt](es_PE.txt) a un diccionario binario AOSP/FUTO compatible con teclados basados en Trie.

## Script de compilación

El archivo [build_es_PE_dict.sh](build_es_PE_dict.sh) automatiza el proceso completo:

1. Descarga `dicttool_aosp.jar` desde el release de HeliBoard si no está presente.
2. Limpia [es_PE.txt](es_PE.txt) eliminando la primera línea, quitando flags morfológicos como `/AS` o `/S` y agregando la frecuencia `,f=100`.
3. Genera un archivo intermedio de limpieza con la lista plana y la frecuencia estándar.
4. Compila el diccionario binario [es_PE.dict](es_PE.dict) con `makedict`.

## Uso

```bash
chmod +x build_es_PE_dict.sh
./build_es_PE_dict.sh
```

El resultado final es [es_PE.dict](es_PE.dict), listo para usarse como diccionario binario indexado.