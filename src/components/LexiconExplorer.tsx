import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  Copy,
  Check,
  MapPin,
  Sparkles,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info,
  Tag,
  Code2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { WordEntry, SearchFilters, SearchResponse } from "../types";
import { searchWords, deleteCustomWord } from "../services/api";

interface LexiconExplorerProps {
  onSelectTriePrefix?: (prefix: string) => void;
  onOpenAddModal: () => void;
}

export const LexiconExplorer: React.FC<LexiconExplorerProps> = ({
  onSelectTriePrefix,
  onOpenAddModal,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    mode: "contains",
    dataset: "pe_only",
    minLength: undefined,
    maxLength: undefined,
    hasAccent: null,
    sortBy: "word",
    sortOrder: "asc",
    page: 1,
    pageSize: 36,
  });

  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordEntry | null>(null);

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await searchWords(filters);
      setResponse(data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 150);
    return () => clearTimeout(timer);
  }, [performSearch]);

  const handleCopy = (word: string, id: string) => {
    navigator.clipboard.writeText(word);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteCustom = async (word: string) => {
    if (confirm(`¿Eliminar "${word}" del léxico personalizado?`)) {
      await deleteCustomWord(word);
      performSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar & Top Controls */}
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={filters.query}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, query: e.target.value, page: 1 }))
              }
              placeholder="Buscar palabras, topónimos o raíces (ej. Abancay, ceviche, cantar, *bamba)..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all font-mono"
            />
            {filters.query && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, query: "", page: 1 }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-semibold px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Match Mode */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
            {[
              { id: "contains", label: "Contiene" },
              { id: "startsWith", label: "Comienza" },
              { id: "endsWith", label: "Termina" },
              { id: "exact", label: "Exacto" },
              { id: "regex", label: "Regex" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    mode: m.id as any,
                    page: 1,
                  }))
                }
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filters.mode === m.id
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Toggle Advanced Filters */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
              showAdvanced
                ? "bg-slate-800 text-rose-400 border-rose-500/40"
                : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>

        {/* Dataset Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800/80">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            Conjunto:
          </span>

          {[
            { id: "pe_only", label: "🇵🇪 Perú (es_PE)", desc: "Léxico oficial peruano" },
            { id: "exclusive_pe", label: "✨ Exclusivos de Perú", desc: "Palabras solo presentes en es_PE" },
            { id: "all", label: "🌐 Todos los léxicos", desc: "es_PE + es.dic combinado" },
            { id: "es_only", label: "🇪🇸 General (es.dic)", desc: "Español estándar" },
            { id: "shared", label: "🤝 Compartidos", desc: "Presentes en ambos diccionarios" },
            { id: "custom", label: "⭐ Personalizados", desc: "Agregados por ti" },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  dataset: d.id as any,
                  page: 1,
                }))
              }
              title={d.desc}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filters.dataset === d.id
                  ? "bg-rose-600/30 text-rose-300 border border-rose-500/50 shadow-sm"
                  : "bg-slate-950/60 text-slate-400 border border-slate-800/80 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Advanced Filters Drawer */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/40 p-4 rounded-xl">
            {/* Longitud Mínima */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Longitud mínima de caracteres
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={filters.minLength ?? ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    minLength: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    page: 1,
                  }))
                }
                placeholder="Ej. 5"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Longitud Máxima */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Longitud máxima de caracteres
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={filters.maxLength ?? ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    maxLength: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    page: 1,
                  }))
                }
                placeholder="Ej. 12"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Tildes / Acentos */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Acentuación / Tildes
              </label>
              <select
                value={filters.hasAccent === null ? "all" : filters.hasAccent ? "true" : "false"}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    hasAccent: e.target.value === "all" ? null : e.target.value === "true",
                    page: 1,
                  }))
                }
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
              >
                <option value="all">Todas (con o sin tilde)</option>
                <option value="true">Solo con tildes (á, é, í, ó, ú, ñ)</option>
                <option value="false">Solo sin tildes</option>
              </select>
            </div>

            {/* Ordenamiento */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Ordenar por
              </label>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: e.target.value as any,
                      page: 1,
                    }))
                  }
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="word">Alfabético</option>
                  <option value="length">Longitud</option>
                  <option value="frequency">Frecuencia</option>
                </select>

                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
                      page: 1,
                    }))
                  }
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:text-white text-xs flex items-center gap-1"
                  title="Cambiar orden ascendente/descendente"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  {filters.sortOrder === "asc" ? "A-Z" : "Z-A"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>
            Mostrando{" "}
            <strong className="text-slate-200 font-mono">
              {response?.total.toLocaleString() ?? 0}
            </strong>{" "}
            palabras encontradas
          </span>
          {response && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {response.tookMs}ms
            </span>
          )}
        </div>

        {/* Page size selector */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Ver por página:</span>
          {[24, 36, 60, 100].map((size) => (
            <button
              key={size}
              onClick={() => setFilters((prev) => ({ ...prev, pageSize: size, page: 1 }))}
              className={`px-2 py-0.5 rounded font-mono ${
                filters.pageSize === size
                  ? "bg-rose-600 text-white font-bold"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Word Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-slate-900/60 border border-slate-800/60 rounded-xl animate-pulse p-4"
            />
          ))}
        </div>
      ) : response && response.words.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {response.words.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedWord(item)}
              className={`group relative p-3.5 bg-slate-900/80 hover:bg-slate-850 border rounded-xl transition-all cursor-pointer flex flex-col justify-between ${
                selectedWord?.id === item.id
                  ? "border-rose-500 bg-slate-900 shadow-md shadow-rose-950/30"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-100 text-base font-mono tracking-tight group-hover:text-rose-400 transition-colors break-all">
                    {item.cleanWord}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(item.cleanWord, item.id);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
                    title="Copiar palabra"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Raw Hunspell format if flags exist */}
                {item.flags && (
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                    <Code2 className="w-3 h-3 text-slate-600" />
                    {item.rawLine}
                  </div>
                )}
              </div>

              {/* Tags & Metadata */}
              <div className="mt-3 pt-2 border-t border-slate-850 flex items-center justify-between gap-1 text-[11px]">
                <div className="flex flex-wrap items-center gap-1">
                  {item.isToponym && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-medium border border-amber-500/30">
                      <MapPin className="w-2.5 h-2.5" />
                      Topónimo
                    </span>
                  )}
                  {item.isRegional && (
                    <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-medium border border-rose-500/30">
                      🇵🇪 Peruanismo
                    </span>
                  )}
                  {item.isCustom && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-medium border border-emerald-500/30">
                      Personalizado
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
                  <span title="Frecuencia AOSP">f={item.frequency}</span>
                  <span>•</span>
                  <span>{item.length}c</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">
            No se encontraron palabras
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Prueba a cambiar el modo de búsqueda o los filtros de conjunto de datos.
            ¿Deseas agregar esta palabra al diccionario peruano?
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-500 transition-all shadow-lg shadow-rose-950/40"
          >
            Agregar "{filters.query}" al Diccionario
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {response && response.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 px-1">
          <div className="text-xs text-slate-400">
            Página <span className="font-mono text-slate-200">{response.page}</span> de{" "}
            <span className="font-mono text-slate-200">{response.totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={response.page <= 1}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
              }
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Anterior
            </button>

            {/* Jump direct page quick input */}
            <input
              type="number"
              min="1"
              max={response.totalPages}
              value={response.page}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1 && val <= response.totalPages) {
                  setFilters((prev) => ({ ...prev, page: val }));
                }
              }}
              className="w-16 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-center text-xs text-slate-200 font-mono"
            />

            <button
              disabled={response.page >= response.totalPages}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Math.min(response.totalPages, prev.page + 1),
                }))
              }
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center gap-1"
            >
              Siguiente
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Selected Word Details Drawer / Modal */}
      {selectedWord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-rose-400 font-bold">
                  Detalle del Término
                </span>
                <h3 className="text-2xl font-bold font-mono text-white mt-1">
                  {selectedWord.cleanWord}
                </h3>
              </div>
              <button
                onClick={() => setSelectedWord(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Línea original (Hunspell):</span>
                <span className="font-mono text-slate-200">{selectedWord.rawLine || "N/A"}</span>
              </div>

              {selectedWord.flags && (
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Flags morfológicos:</span>
                  <span className="font-mono text-rose-300">/{selectedWord.flags}</span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Frecuencia AOSP / FUTO:</span>
                <span className="font-mono text-emerald-400 font-bold">f={selectedWord.frequency}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Longitud:</span>
                <span className="font-mono text-slate-200">{selectedWord.length} letras</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Presencia en léxicos:</span>
                <span className="text-slate-200">
                  {selectedWord.inPeruvian ? "🇵🇪 es_PE " : ""}
                  {selectedWord.inGeneral ? "🇪🇸 es.dic" : ""}
                </span>
              </div>

              {selectedWord.notes && (
                <div className="py-1">
                  <span className="text-slate-400 block mb-1">Notas lingüísticas:</span>
                  <p className="text-slate-300 italic">{selectedWord.notes}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              {onSelectTriePrefix && (
                <button
                  onClick={() => {
                    onSelectTriePrefix(selectedWord.cleanWord.slice(0, 3));
                    setSelectedWord(null);
                  }}
                  className="flex-1 py-2 px-3 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-500 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Inspeccionar en Árbol Trie
                </button>
              )}

              <button
                onClick={() => handleCopy(selectedWord.cleanWord, "modal")}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar
              </button>

              {selectedWord.isCustom && (
                <button
                  onClick={() => {
                    handleDeleteCustom(selectedWord.cleanWord);
                    setSelectedWord(null);
                  }}
                  className="py-2 px-3 bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
