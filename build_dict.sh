#!/usr/bin/env bash

wget -q https://github.com/Helium314/HeliBoard/releases/download/v1.2/dicttool_aosp.jar
sed '1d;s/\/[A-Z]*//g;s/$/ ,f=100/' es.dic.txt > temp_procesado.txt
java -jar dicttool_aosp.jar makedict --input temp_procesado.txt --output peru_final.dict
