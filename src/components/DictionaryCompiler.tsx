import React, { useState, useEffect } from "react";
import {
  Cpu,
  Play,
  Download,
  Copy,
  Check,
  FileText,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Upload,
  RefreshCw,
  Zap,
  Smartphone,
  CheckCheck,
} from "lucide-react";
import { CleanOptions, CleanResult } from "../types";
import { cleanLexicon, fetchBinaryStatus, compileBinary } from "../services/api";

export const DictionaryCompiler: React.FC = () => {
  const [customText, setCustomText] = useState<string>("");
  const [useDefaultDataset, setUseDefaultDataset] = useState<boolean>(true);
  const [stripFlags, setStripFlags] = useState<boolean>(true);
  const [customRegex, setCustomRegex] = useState<string>("/[A-Z]*");
  const [defaultFrequency, setDefaultFrequency] = useState<number>(100);
  const [frequencyRule, setFrequencyRule] = useState<"uniform" | "length_weighted" | "custom_curve">("uniform");
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);
  const [sortAlphabetically, setSortAlphabetically] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<CleanResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  // Binary compiler state
  const [binaryStatus, setBinaryStatus] = useState<{
    dictExists: boolean;
    dictSize: number;
    dictSizeKb: string;
    dictModified: number;
    magicHex: string;
    isMagicValid: boolean;
    combinedExists: boolean;
    combinedSize: number;
    combinedSizeKb: string;
    locale: string;
    commandUsed: string;
  } | null>(null);
  const [compilingBinary, setCompilingBinary] = useState<boolean>(false);
  const [binarySuccessMsg, setBinarySuccessMsg] = useState<string>("");

  const loadBinaryStatus = async () => {
    try {
      const data = await fetchBinaryStatus();
      setBinaryStatus(data);
    } catch (err) {
      console.error("Error loading binary status:", err);
    }
  };

  const handleCompileBinary = async () => {
    setCompilingBinary(true);
    setBinarySuccessMsg("");
    try {
      const res = await compileBinary();
      setBinarySuccessMsg(`¡Compilado con éxito! ${res.wordCount.toLocaleString()} palabras generadas (${res.dictSizeKb} KB)`);
      await loadBinaryStatus();
    } catch (err: any) {
      console.error("Binary compile error:", err);
      alert(err.message || "Error al compilar el diccionario binario");
    } finally {
      setCompilingBinary(false);
    }
  };

  const handleCompile = async () => {
    setLoading(true);
    try {
      const res = await cleanLexicon({
        text: useDefaultDataset ? undefined : customText,
        stripFlags,
        customRegex,
        defaultFrequency,
        frequencyRule,
        removeDuplicates,
        sortAlphabetically,
      });
      setResult(res);
    } catch (err) {
      console.error("Compile error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCompile();
    loadBinaryStatus();
  }, []);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCustomText(content);
      setUseDefaultDataset(false);
    };
    reader.readAsText(file);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.formattedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-950/40">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Compilador de Diccionario AOSP / FUTO
              </h2>
              <p className="text-xs text-slate-400">
                Pipeline completo: <code className="text-slate-300 font-mono">es_PE.txt</code> → <code className="text-slate-300 font-mono">es_PE_wordlist.combined</code> → <code className="text-rose-300 font-mono">main_es_PE.dict</code> mediante <code className="text-slate-300 font-mono">dicttool_aosp.jar</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCompileBinary}
              disabled={compilingBinary}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
            >
              {compilingBinary ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 fill-current text-amber-300" />
              )}
              {compilingBinary ? "Compilando Binario..." : "Re-compilar main_es_PE.dict"}
            </button>
          </div>
        </div>
      </div>

      {/* Hero Binary File Status Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                AOSP Binary Trie Format
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                FUTO Keyboard Compatible
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              main_es_PE.dict (Diccionario Binario para Android)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/download/binary"
              download="main_es_PE.dict"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950/50 transition-all"
            >
              <Download className="w-4 h-4" />
              Descargar main_es_PE.dict ({binaryStatus?.dictSizeKb || "432.4"} KB)
            </a>
            <a
              href="/api/download/combined"
              download="es_PE_wordlist.combined"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Descargar .combined
            </a>
          </div>
        </div>

        {binarySuccessMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{binarySuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <span className="text-slate-400 block text-[11px]">Tamaño Binario</span>
            <span className="text-white font-mono font-bold text-sm block mt-0.5">
              {binaryStatus?.dictSizeKb || "432.4"} KB
            </span>
            <span className="text-[10px] text-slate-500">Trie comprimido en disco</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <span className="text-slate-400 block text-[11px]">Magic Number AOSP</span>
            <span className="text-emerald-400 font-mono font-bold text-sm block mt-0.5">
              0x9BC13AFE {binaryStatus?.isMagicValid ? "✓" : ""}
            </span>
            <span className="text-[10px] text-slate-500">Verificado versión v2/v3</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <span className="text-slate-400 block text-[11px]">Locale & Destino</span>
            <span className="text-rose-400 font-mono font-bold text-sm block mt-0.5">
              es_PE (Perú)
            </span>
            <span className="text-[10px] text-slate-500">Español de Perú</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <span className="text-slate-400 block text-[11px]">Comando Oficial</span>
            <span className="text-amber-300 font-mono font-semibold text-[11px] block mt-0.5 truncate">
              makedict -s ... -d ...
            </span>
            <span className="text-[10px] text-slate-500">dicttool_aosp.jar</span>
          </div>
        </div>

        {/* FUTO / HeliBoard Installation Instructions */}
        <div className="bg-slate-950/90 border border-slate-850 rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Smartphone className="w-4 h-4 text-rose-400" />
            <span>¿Cómo instalar en FUTO Keyboard o HeliBoard en tu dispositivo Android?</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 text-[11px]">
            <li>Descarga el archivo <code className="text-rose-300 font-mono">main_es_PE.dict</code> en la memoria de tu teléfono.</li>
            <li>Abre los <strong className="text-slate-300">Ajustes de FUTO Keyboard</strong> (o HeliBoard).</li>
            <li>Ve a <strong className="text-slate-300">Idiomas / Diccionarios</strong> → <strong className="text-slate-300">Español (Perú)</strong> (o Administrar diccionarios externos).</li>
            <li>Selecciona <strong className="text-slate-300">"Importar diccionario binario (.dict)"</strong> y elige el archivo <code className="text-rose-300 font-mono">main_es_PE.dict</code>.</li>
            <li>¡Listo! El teclado cargará de inmediato todas las sugerencias, topónimos y peruanismos con predicción instantánea.</li>
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Settings & Input */}
        <div className="lg:col-span-5 space-y-6">
          {/* Source Selection */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-400" />
              1. Fuente de Datos
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setUseDefaultDataset(true)}
                className={`p-3 rounded-xl text-left border text-xs transition-all ${
                  useDefaultDataset
                    ? "bg-rose-600/20 border-rose-500/50 text-rose-200 shadow-sm"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <span className="font-bold block text-white">es_PE.txt (58k)</span>
                <span className="text-[11px] text-slate-400">Léxico oficial de Perú</span>
              </button>

              <button
                onClick={() => setUseDefaultDataset(false)}
                className={`p-3 rounded-xl text-left border text-xs transition-all ${
                  !useDefaultDataset
                    ? "bg-rose-600/20 border-rose-500/50 text-rose-200 shadow-sm"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <span className="font-bold block text-white">Personalizado</span>
                <span className="text-[11px] text-slate-400">Pegar o subir archivo</span>
              </button>
            </div>

            {!useDefaultDataset && (
              <div className="space-y-3">
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files?.[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    dragOver
                      ? "border-rose-500 bg-rose-500/10"
                      : "border-slate-800 hover:border-slate-700 bg-slate-950/60"
                  }`}
                  onClick={() => document.getElementById("file-upload-input")?.click()}
                >
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-300 font-medium">
                    Arrastra un archivo .txt / .dic o haz clic para explorar
                  </p>
                  <input
                    id="file-upload-input"
                    type="file"
                    accept=".txt,.dic"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Pega aquí tu lista de palabras (ej. cantar/AS, ceviche, huayno, Abancay)..."
                  rows={5}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Cleaning Pipeline Rules */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-400" />
              2. Reglas de Transformación
            </h3>

            {/* Strip Morphological Flags */}
            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="text-slate-300 font-medium">
                  Eliminar flags morfológicos (<code className="text-rose-300">/AS, /S, /p</code>)
                </span>
                <input
                  type="checkbox"
                  checked={stripFlags}
                  onChange={(e) => setStripFlags(e.target.checked)}
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 h-4 w-4 bg-slate-950"
                />
              </label>

              {stripFlags && (
                <div className="pl-2">
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Expresión regular para limpiar flags:
                  </label>
                  <input
                    type="text"
                    value={customRegex}
                    onChange={(e) => setCustomRegex(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Equivalente en bash: <code className="text-slate-400">sed 's/\/[A-Z]*//g'</code>
                  </span>
                </div>
              )}
            </div>

            {/* Frequency Weighting */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-medium text-slate-300 block">
                Asignación de Frecuencia AOSP (<code className="text-emerald-400">,f=N</code>)
              </label>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "uniform", label: "Uniforme", desc: "f=100 fijo" },
                  { id: "length_weighted", label: "Ponderado", desc: "Cortas f=140, largas f=80" },
                  { id: "custom_curve", label: "Curva Zipf", desc: "250 / sqrt(len)" },
                ].map((rule) => (
                  <button
                    key={rule.id}
                    onClick={() => setFrequencyRule(rule.id as any)}
                    className={`p-2 rounded-xl text-left border text-xs transition-all ${
                      frequencyRule === rule.id
                        ? "bg-rose-600/20 border-rose-500/50 text-rose-200"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <span className="font-semibold block text-[11px] text-slate-200">
                      {rule.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block">{rule.desc}</span>
                  </button>
                ))}
              </div>

              {frequencyRule === "uniform" && (
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Frecuencia por defecto:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {defaultFrequency}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="255"
                    value={defaultFrequency}
                    onChange={(e) => setDefaultFrequency(parseInt(e.target.value, 10))}
                    className="w-full accent-rose-500 bg-slate-950"
                  />
                </div>
              )}
            </div>

            {/* Deduplication & Sorting */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="text-slate-300">Eliminar duplicados</span>
                <input
                  type="checkbox"
                  checked={removeDuplicates}
                  onChange={(e) => setRemoveDuplicates(e.target.checked)}
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 h-4 w-4 bg-slate-950"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="text-slate-300">Ordenar alfabéticamente</span>
                <input
                  type="checkbox"
                  checked={sortAlphabetically}
                  onChange={(e) => setSortAlphabetically(e.target.checked)}
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 h-4 w-4 bg-slate-950"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Results & Export */}
        <div className="lg:col-span-7 space-y-6">
          {/* Compilation Metrics */}
          {result && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <span className="text-[11px] text-slate-400 font-medium block">
                  Líneas de Entrada
                </span>
                <span className="text-xl font-bold font-mono text-white mt-1 block">
                  {result.originalLinesCount.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">Léxico fuente</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <span className="text-[11px] text-slate-400 font-medium block">
                  Palabras Limpias
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                  {result.cleanedCount.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-500/70 mt-1 block">
                  Sin flags / Normalizadas
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <span className="text-[11px] text-slate-400 font-medium block">
                  Duplicados Depurados
                </span>
                <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
                  {result.duplicatesRemoved.toLocaleString()}
                </span>
                <span className="text-[10px] text-rose-500/70 mt-1 block">Ocurrencias extra</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <span className="text-[11px] text-slate-400 font-medium block">
                  Tamaño de Salida
                </span>
                <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                  {result.fileSizeEstimateKb} KB
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">Texto AOSP</span>
              </div>
            </div>
          )}

          {/* Export Formats Center */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4 text-rose-400" />
                Descargar Diccionarios y Recursos del Pipeline
              </span>
              <button
                onClick={handleCopy}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 border border-slate-700 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copiar Muestra
                  </>
                )}
              </button>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Binary dict */}
              <a
                href="/api/download/binary"
                download="main_es_PE.dict"
                className="p-3.5 bg-gradient-to-br from-rose-950/40 to-slate-900 border border-rose-500/40 hover:border-rose-400 rounded-xl transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-xs text-rose-300 group-hover:text-rose-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
                    main_es_PE.dict (Binario Final)
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    FUTO / AOSP Keyboard ({binaryStatus?.dictSizeKb || "432.4"} KB)
                  </div>
                </div>
                <Download className="w-4 h-4 text-rose-400 group-hover:translate-y-0.5 transition-transform" />
              </a>

              {/* Combined wordlist */}
              <a
                href="/api/download/combined"
                download="es_PE_wordlist.combined"
                className="p-3.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-xs text-white group-hover:text-emerald-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    es_PE_wordlist.combined
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Formato Combined para dicttool
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </a>

              {/* AOSP / FUTO text */}
              <a
                href="/api/export/aosp?dataset=pe"
                download="es_PE_clean.txt"
                className="p-3.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-xl transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-xs text-white group-hover:text-rose-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Formato Texto (word ,f=100)
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    es_PE_clean.txt
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
              </a>

              {/* Hunspell .dic */}
              <a
                href="/api/export/hunspell?dataset=pe"
                download="es_PE.dic"
                className="p-3.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-xl transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-xs text-white group-hover:text-rose-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    Hunspell Dictionary
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    es_PE.dic
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
              </a>
            </div>
          </div>

          {/* Live Preview Terminal */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-[11px] text-slate-400 font-sans ml-1">
                  Vista previa de salida formateada (primeras 30 líneas)
                </span>
              </div>
              <span className="text-[10px] text-slate-500">AOSP ready</span>
            </div>

            <div className="h-64 overflow-y-auto space-y-1 text-slate-300 pr-2">
              {result?.sampleLines.map((line, idx) => (
                <div key={idx} className="flex items-center justify-between hover:bg-slate-900 px-2 py-0.5 rounded">
                  <span className="text-rose-300">{line.split(" ")[0]}</span>
                  <span className="text-emerald-400 text-[11px]">{line.split(" ")[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
