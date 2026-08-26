import React, { useState } from "react";
import {
  GitCompare,
  CheckCircle2,
  PlusCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  FileText,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { compareDiff, addCustomWord } from "../services/api";

interface LexiconDiffProps {
  onRefreshExplorer?: () => void;
}

export const LexiconDiff: React.FC<LexiconDiffProps> = ({ onRefreshExplorer }) => {
  const [inputText, setInputText] = useState<string>(
    "ceviche\nanticucho\nchamba\npata\nchullo\nquechua\nhuayno\npisco\npituco\nmisio\njatear\ntonear\nchoclo\nrocoto\nmaracuyá"
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [diffResult, setDiffResult] = useState<{
    totalInputWords: number;
    matchedCount: number;
    newWordsCount: number;
    newWords: string[];
    matchedWords: string[];
  } | null>(null);

  const [addingAll, setAddingAll] = useState<boolean>(false);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  const handleCompare = async () => {
    setLoading(true);
    setAddedSuccess(false);
    try {
      const words = inputText.split(/\r?\n/).map((w) => w.trim()).filter(Boolean);
      const res = await compareDiff(words);
      setDiffResult(res);
    } catch (err) {
      console.error("Diff error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllNewWords = async () => {
    if (!diffResult || diffResult.newWords.length === 0) return;
    setAddingAll(true);
    try {
      for (const word of diffResult.newWords) {
        await addCustomWord({
          word,
          frequency: 110,
          notes: "Agregado mediante comparador de léxico",
          isToponym: /^[A-Z]/.test(word),
        });
      }
      setAddedSuccess(true);
      if (onRefreshExplorer) onRefreshExplorer();
      // Re-compare to update status
      handleCompare();
    } catch (err) {
      console.error("Error adding words:", err);
    } finally {
      setAddingAll(false);
    }
  };

  const loadPreset = (type: "gastronomy" | "toponyms" | "slang") => {
    if (type === "gastronomy") {
      setInputText(
        "ceviche\nanticucho\nrocoto\npachamanca\ncau cau\nchicha morada\nsuspiro limeño\nlúcuma\npicarones\nají de gallina\ntiradito\npisco sour"
      );
    } else if (type === "toponyms") {
      setInputText(
        "Abancay\nChachapoyas\nOllantaytambo\nHuancavelica\nMachu Picchu\nCaral\nPaucartambo\nUrcos\nAnta\nCalca\nYungay\nSicuani"
      );
    } else if (type === "slang") {
      setInputText(
        "chamba\nchoche\npata\ncausa\njatear\ntonear\npituco\nmisio\ncalato\nchibolo\nmonse\nhuachafo\npaltas"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 via-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-rose-950/40">
              <GitCompare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Comparador y Auditor de Léxico
              </h2>
              <p className="text-xs text-slate-400">
                Compara listas externas con <code className="text-rose-300 font-mono">es_PE.txt</code> para detectar términos faltantes, peruanismos y cobertura.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCompare}
              disabled={loading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-rose-950/40 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <GitCompare className="w-4 h-4" />
              )}
              {loading ? "Analizando..." : "Comparar Léxico"}
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400">Listas predefinidas:</span>
          <button
            onClick={() => loadPreset("gastronomy")}
            className="px-2.5 py-1 rounded-lg text-xs bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300"
          >
            🍲 Gastronomía Peruana
          </button>
          <button
            onClick={() => loadPreset("toponyms")}
            className="px-2.5 py-1 rounded-lg text-xs bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300"
          >
            🏔️ Topónimos Andinos
          </button>
          <button
            onClick={() => loadPreset("slang")}
            className="px-2.5 py-1 rounded-lg text-xs bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300"
          >
            🗣️ Peruanismos y Jerga
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-400" />
              Lista de Palabras a Auditar
            </h3>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={14}
              placeholder="Ingresa una palabra por línea..."
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Comparison Results */}
        <div className="lg:col-span-7 space-y-6">
          {diffResult ? (
            <div className="space-y-6">
              {/* Stat Counters */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-[11px] text-slate-400 font-medium block">Total auditadas</span>
                  <span className="text-xl font-bold font-mono text-white">
                    {diffResult.totalInputWords}
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-[11px] text-slate-400 font-medium block">Ya presentes en es_PE</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {diffResult.matchedCount}
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-[11px] text-slate-400 font-medium block">Nuevos términos</span>
                  <span className="text-xl font-bold font-mono text-rose-400">
                    {diffResult.newWordsCount}
                  </span>
                </div>
              </div>

              {/* Action Banner for New Terms */}
              {diffResult.newWordsCount > 0 && (
                <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Se detectaron {diffResult.newWordsCount} términos candidatos para enriquecer el léxico
                    </h4>
                    <p className="text-[11px] text-rose-300/80 mt-0.5">
                      Puedes agregarlos al diccionario en memoria con un solo clic.
                    </p>
                  </div>

                  <button
                    onClick={handleAddAllNewWords}
                    disabled={addingAll || addedSuccess}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-950/40 disabled:opacity-50 whitespace-nowrap"
                  >
                    {addedSuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> ¡Agregadas!
                      </>
                    ) : addingAll ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Agregando...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-3.5 h-3.5" /> Agregar al Léxico
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* New Terms Breakdown */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  Nuevas Palabras No Encontradas en es_PE.txt ({diffResult.newWords.length})
                </h4>
                {diffResult.newWords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                    {diffResult.newWords.map((w) => (
                      <span
                        key={w}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 font-mono text-xs"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Todas las palabras del listado ya existen en el diccionario oficial peruano.
                  </p>
                )}
              </div>

              {/* Matched Words Breakdown */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Palabras Validadas en es_PE.txt ({diffResult.matchedWords.length})
                </h4>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                  {diffResult.matchedWords.map((w) => (
                    <span
                      key={w}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 font-mono text-xs"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
              Haz clic en "Comparar Léxico" para auditar la lista contra el diccionario peruano.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
