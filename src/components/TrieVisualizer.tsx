import React, { useState, useEffect } from "react";
import {
  Layers,
  Sparkles,
  GitBranch,
  Smartphone,
  ChevronRight,
  TrendingUp,
  Search,
  CheckCircle2,
  CornerDownRight,
} from "lucide-react";
import { TrieVisualNode } from "../types";
import { fetchTrieTree, fetchAutocomplete } from "../services/api";

interface TrieVisualizerProps {
  initialPrefix?: string;
}

export const TrieVisualizer: React.FC<TrieVisualizerProps> = ({
  initialPrefix = "Aba",
}) => {
  const [prefix, setPrefix] = useState<string>(initialPrefix);
  const [depth, setDepth] = useState<number>(3);
  const [maxChildren, setMaxChildren] = useState<number>(6);
  const [treeData, setTreeData] = useState<TrieVisualNode | null>(null);
  const [autocomplete, setAutocomplete] = useState<{
    suggestions: { word: string; frequency: number; isPeruvian: boolean }[];
    nextChars: { char: string; count: number; probability: number }[];
    hasExactMatch: boolean;
  }>({
    suggestions: [],
    nextChars: [],
    hasExactMatch: false,
  });

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialPrefix) {
      setPrefix(initialPrefix);
    }
  }, [initialPrefix]);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [treeRes, autoRes] = await Promise.all([
          fetchTrieTree(prefix, depth, maxChildren),
          fetchAutocomplete(prefix, 8),
        ]);
        if (active) {
          setTreeData(treeRes);
          setAutocomplete(autoRes);
        }
      } catch (err) {
        console.error("Trie fetch error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(loadData, 120);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [prefix, depth, maxChildren]);

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: TrieVisualNode, level: number = 0) => {
    const isRoot = level === 0;

    return (
      <div key={node.fullPrefix || "root"} className="flex flex-col items-start">
        <div
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
            node.isWord
              ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-sm"
              : "bg-slate-900/90 border-slate-800 text-slate-200 hover:border-rose-500/40"
          }`}
          onClick={() => node.fullPrefix && setPrefix(node.fullPrefix)}
          title={`Prefijo: "${node.fullPrefix}" — ${node.wordCount} palabras derivadas`}
        >
          <span className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-rose-400">
            {node.char === "ROOT" ? "★" : node.char}
          </span>

          <span className="font-mono text-xs font-semibold">
            {node.fullPrefix || (isRoot ? "(Raíz)" : "")}
          </span>

          {node.isWord && (
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
              f={node.frequency}
            </span>
          )}

          <span className="text-[10px] text-slate-500 font-mono">
            {node.wordCount} {node.wordCount === 1 ? "palabra" : "palabras"}
          </span>
        </div>

        {/* Children Branches */}
        {node.children && node.children.length > 0 && (
          <div className="pl-6 ml-3 border-l-2 border-slate-800/80 space-y-2 mt-2">
            {node.children.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const samplePrefixes = ["Aba", "Per", "Cuz", "Inc", "Cev", "Hua", "Mac", "Lim", "Aco"];

  return (
    <div className="space-y-6">
      {/* Title & Keyboard Simulation Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-950/40">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Explorador de Árbol Trie & Simulador de Teclado
              </h2>
              <p className="text-xs text-slate-400">
                Visualiza cómo el teclado AOSP / FUTO indexa ramas de prefijos y calcula predicciones en tiempo real.
              </p>
            </div>
          </div>

          {/* Quick Prefixes */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 mr-1">Prefijos sugeridos:</span>
            {samplePrefixes.map((p) => (
              <button
                key={p}
                onClick={() => setPrefix(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  prefix === p
                    ? "bg-rose-600 text-white"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Keyboard Prediction Bar Simulator */}
        <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Smartphone className="w-4 h-4 text-rose-400" />
              Barra de Predicción HeliBoard / AOSP Keyboard
            </span>
            <span className="text-[11px] text-slate-500">
              {autocomplete.hasExactMatch ? "✓ Palabra válida en diccionario" : "Buscando completados..."}
            </span>
          </div>

          {/* Suggestion Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {autocomplete.suggestions.length > 0 ? (
              autocomplete.suggestions.map((s, idx) => (
                <button
                  key={s.word}
                  onClick={() => setPrefix(s.word)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    idx === 0
                      ? "bg-rose-600 text-white font-bold shadow-md shadow-rose-900/40"
                      : "bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-850"
                  }`}
                >
                  <span>{s.word}</span>
                  {s.isPeruvian && (
                    <span className="text-[9px] px-1 rounded bg-slate-950/60 text-amber-300">
                      🇵🇪
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 opacity-80">
                    f={s.frequency}
                  </span>
                </button>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic py-1">
                Escribe un prefijo para ver sugerencias predictivas...
              </span>
            )}
          </div>

          {/* Next Character Probability */}
          {autocomplete.nextChars.length > 0 && (
            <div className="pt-2 border-t border-slate-900">
              <div className="text-[11px] text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Probabilidad de siguiente tecla:</span>
                <span className="font-mono text-rose-400">
                  Top: '{autocomplete.nextChars[0]?.char}' ({autocomplete.nextChars[0]?.probability}%)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {autocomplete.nextChars.slice(0, 8).map((nc) => (
                  <button
                    key={nc.char}
                    onClick={() => setPrefix((prev) => prev + nc.char)}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-[11px] font-mono text-slate-300 flex items-center gap-1"
                  >
                    <span className="font-bold text-rose-300">'{nc.char}'</span>
                    <span className="text-slate-500 text-[10px]">{nc.probability}%</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Prefix Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Search className="w-4 h-4 text-rose-400" />
              Prefijo a Inspeccionar
            </h3>

            <div>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="Prefijo (ej. Aba, Peru, Lima)..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm focus:ring-1 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Depth slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Profundidad visual:</span>
                <span className="font-mono text-rose-400 font-bold">{depth} niveles</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value, 10))}
                className="w-full accent-rose-500 bg-slate-950"
              />
            </div>

            {/* Max Children */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Hijos por nodo:</span>
                <span className="font-mono text-rose-400 font-bold">{maxChildren} ramas</span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                value={maxChildren}
                onChange={(e) => setMaxChildren(parseInt(e.target.value, 10))}
                className="w-full accent-rose-500 bg-slate-950"
              />
            </div>

            {/* Trie Structure Legend */}
            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-slate-400 block">Leyenda del Trie:</span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50 inline-block" />
                <span className="text-slate-300">Palabra terminal completa</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700 inline-block" />
                <span className="text-slate-400">Nodo intermedio de prefijo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tree Diagram */}
        <div className="lg:col-span-8">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[450px] overflow-x-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-850">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-rose-400" />
                Jerarquía de Ramas en el Trie
              </span>
              <span className="text-xs font-mono text-slate-500">
                Prefijo actual: <strong className="text-rose-400">"{prefix}"</strong>
              </span>
            </div>

            {loading ? (
              <div className="py-20 text-center space-y-2 text-slate-500">
                <Layers className="w-8 h-8 mx-auto animate-pulse text-rose-500" />
                <p className="text-xs">Recorriendo ramas del Trie...</p>
              </div>
            ) : treeData ? (
              <div className="py-2">{renderTreeNode(treeData)}</div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs">
                No se encontró ninguna rama con el prefijo "{prefix}".
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
