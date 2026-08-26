import React from "react";
import { BookOpen, Sparkles, Cpu, Layers, BarChart2, Plus, Download, GitCompare } from "lucide-react";
import { LexiconStats } from "../types";

interface HeaderProps {
  activeTab: "explorer" | "compiler" | "trie" | "diff" | "stats";
  setActiveTab: (tab: "explorer" | "compiler" | "trie" | "diff" | "stats") => void;
  stats: LexiconStats | null;
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  stats,
  onOpenAddModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/40">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Mi Diccionario
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                    es_PE & AOSP
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Léxico de Español Peruano & Compilador de Diccionarios Trie
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab("explorer")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "explorer"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-900/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Explorador
              {stats && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-slate-900/60 text-slate-300 font-mono">
                  {stats.totalPeruvian.toLocaleString()}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("compiler")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "compiler"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-900/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Compilador AOSP
            </button>

            <button
              onClick={() => setActiveTab("trie")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "trie"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-900/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Árbol Trie & Teclado
            </button>

            <button
              onClick={() => setActiveTab("diff")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "diff"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-900/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              Comparador
            </button>

            <button
              onClick={() => setActiveTab("stats")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "stats"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-900/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Métricas
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agregar Término</span>
              <span className="sm:hidden">+</span>
            </button>

            <a
              href="/api/download/binary"
              download="main_es_PE.dict"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600/90 text-white hover:bg-rose-500 shadow-sm shadow-rose-950/40 border border-rose-500/50 transition-all"
              title="Descargar main_es_PE.dict (Binario para FUTO / HeliBoard)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">main_es_PE.dict</span>
              <span className="lg:hidden">.dict</span>
            </a>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-800/60 no-scrollbar">
          {[
            { id: "explorer", label: "Explorador", icon: BookOpen },
            { id: "compiler", label: "Compilador", icon: Cpu },
            { id: "trie", label: "Trie & Teclado", icon: Layers },
            { id: "diff", label: "Comparador", icon: GitCompare },
            { id: "stats", label: "Métricas", icon: BarChart2 },
          ].map((item) => {
            const Icon = item.icon;
            const isCurrent = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-all ${
                  isCurrent
                    ? "bg-rose-600 text-white"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3 h-3" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
