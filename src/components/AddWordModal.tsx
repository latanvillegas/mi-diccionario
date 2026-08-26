import React, { useState } from "react";
import { Plus, X, Sparkles, MapPin, CheckCircle2 } from "lucide-react";
import { addCustomWord } from "../services/api";

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddWordModal: React.FC<AddWordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [word, setWord] = useState("");
  const [frequency, setFrequency] = useState(120);
  const [isToponym, setIsToponym] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) {
      setError("Por favor ingresa una palabra válida.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await addCustomWord({
        word: word.trim(),
        frequency,
        isToponym,
        notes: notes.trim(),
      });
      onSuccess();
      onClose();
      // Reset form
      setWord("");
      setNotes("");
      setIsToponym(false);
    } catch (err: any) {
      setError(err.message || "Error al agregar la palabra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              Agregar Término al Léxico
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-semibold p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Word Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Palabra o Peruanismo *
            </label>
            <input
              type="text"
              required
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Ej. chaufa, anticucho, Ollantaytambo..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm focus:ring-1 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Frequency Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Frecuencia AOSP / FUTO (<code className="text-emerald-400">,f=N</code>):</span>
              <span className="font-mono text-emerald-400 font-bold">{frequency}</span>
            </div>
            <input
              type="range"
              min="1"
              max="255"
              value={frequency}
              onChange={(e) => setFrequency(parseInt(e.target.value, 10))}
              className="w-full accent-rose-500 bg-slate-950"
            />
            <span className="text-[10px] text-slate-500 block mt-0.5">
              100 es estándar. Mayor número = mayor prioridad en predicción de teclado.
            </span>
          </div>

          {/* Toponym toggle */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isToponym}
                onChange={(e) => setIsToponym(e.target.checked)}
                className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 h-4 w-4 bg-slate-950"
              />
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                Es un Topónimo / Lugar del Perú
              </span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas Lingüísticas o Significado (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Plato típico de la costa peruana..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {loading ? "Guardando..." : "Guardar en Léxico"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
