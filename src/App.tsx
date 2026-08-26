import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { LexiconExplorer } from "./components/LexiconExplorer";
import { DictionaryCompiler } from "./components/DictionaryCompiler";
import { TrieVisualizer } from "./components/TrieVisualizer";
import { LexiconDiff } from "./components/LexiconDiff";
import { StatsDashboard } from "./components/StatsDashboard";
import { AddWordModal } from "./components/AddWordModal";
import { LexiconStats } from "./types";
import { fetchStats } from "./services/api";
import { BookOpen, Layers, Cpu, ShieldCheck, Heart, Terminal, Code } from "lucide-react";

export function App() {
  const [activeTab, setActiveTab] = useState<"explorer" | "compiler" | "trie" | "diff" | "stats">("explorer");
  const [stats, setStats] = useState<LexiconStats | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTriePrefix, setSelectedTriePrefix] = useState<string>("Aba");

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSelectTriePrefix = (prefix: string) => {
    setSelectedTriePrefix(prefix);
    setActiveTab("trie");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "explorer" && (
          <LexiconExplorer
            onSelectTriePrefix={handleSelectTriePrefix}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}

        {activeTab === "compiler" && <DictionaryCompiler />}

        {activeTab === "trie" && (
          <TrieVisualizer initialPrefix={selectedTriePrefix} />
        )}

        {activeTab === "diff" && (
          <LexiconDiff onRefreshExplorer={loadStats} />
        )}

        {activeTab === "stats" && <StatsDashboard stats={stats} />}
      </main>

      {/* Add Custom Word Modal */}
      <AddWordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadStats}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Léxico de Español Peruano (<code className="text-slate-400 font-mono">es_PE.txt</code>) & AOSP Binary Dictionary Tools
            </span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400">
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-rose-400" />
              <span>Compatible con <code className="text-slate-300">dicttool_aosp</code> / HeliBoard / FUTO</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
