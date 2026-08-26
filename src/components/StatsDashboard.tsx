import React from "react";
import {
  BarChart2,
  PieChart,
  Hash,
  Layers,
  Sparkles,
  MapPin,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import { LexiconStats } from "../types";

interface StatsDashboardProps {
  stats: LexiconStats | null;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Cargando estadísticas lingüísticas...
      </div>
    );
  }

  // Top 10 initial letters
  const topInitials = stats.topInitialLetters.slice(0, 10);

  // Length distribution sorted
  const lengthEntries = Object.entries(stats.lengthDistribution)
    .map(([len, count]) => ({ length: parseInt(len, 10), count }))
    .filter((e) => e.length >= 2 && e.length <= 18)
    .sort((a, b) => a.length - b.length);

  const maxLenCount = Math.max(...lengthEntries.map((e) => e.count), 1);

  // Top flag rules
  const topFlags = Object.entries(stats.flagDistribution || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-950/40">
            <BarChart2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Métricas & Análisis Lingüístico
            </h2>
            <p className="text-xs text-slate-400">
              Distribución morfológica, frecuencias de caracteres y análisis comparativo del corpus peruano y general.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[11px] text-slate-400 font-medium block">🇵🇪 Léxico Perú</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">
            {stats.totalPeruvian.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">es_PE.txt</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[11px] text-slate-400 font-medium block">🇪🇸 Léxico General</span>
          <span className="text-xl font-bold font-mono text-slate-200 mt-1 block">
            {stats.totalGeneral.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">es.dic</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[11px] text-slate-400 font-medium block">✨ Exclusivos Perú</span>
          <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
            {stats.exclusivePeruvian.toLocaleString()}
          </span>
          <span className="text-[10px] text-rose-500/70 mt-1 block">Solo en Perú</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[11px] text-slate-400 font-medium block">🤝 Compartidas</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            {stats.sharedCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-500/70 mt-1 block">Comunes</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[11px] text-slate-400 font-medium block">Longitud Media</span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
            {stats.avgLength} letras
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Por vocablo</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[11px] text-slate-400 font-medium block">Con Tilde/Acento</span>
          <span className="text-xl font-bold font-mono text-purple-400 mt-1 block">
            {stats.accentedWordsCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {Math.round((stats.accentedWordsCount / (stats.totalUniqueAll || 1)) * 100)}% del total
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Initial Letters Ranking */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              Letras Iniciales Más Frecuentes
            </span>
            <span className="text-xs text-slate-500 font-normal">Top 10</span>
          </h3>

          <div className="space-y-2.5">
            {topInitials.map((item) => (
              <div key={item.letter} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-white w-6">{item.letter}</span>
                  <span className="text-slate-400">{item.count.toLocaleString()} palabras</span>
                  <span className="text-rose-400 font-semibold">{item.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-amber-500 rounded-full"
                    style={{ width: `${item.percentage * 3.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Word Length Histogram */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Hash className="w-4 h-4 text-emerald-400" />
            Distribución por Longitud de Palabra
          </h3>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {lengthEntries.map((item) => {
              const pct = (item.count / maxLenCount) * 100;
              return (
                <div key={item.length} className="space-y-0.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">{item.length} letras</span>
                    <span className="text-slate-400">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Morphological Flags Distribution */}
        {topFlags.length > 0 && (
          <div className="lg:col-span-12 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Flags Morfológicos Hunspell Más Frecuentes en el Léxico Original
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {topFlags.map(([flag, count]) => (
                <div key={flag} className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                  <span className="text-xs font-mono font-bold text-rose-300 block">
                    /{flag}
                  </span>
                  <span className="text-sm font-mono text-slate-200 font-semibold block mt-1">
                    {count.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">ocurrencias</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
