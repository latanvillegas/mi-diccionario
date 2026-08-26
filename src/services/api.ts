import { LexiconStats, SearchFilters, SearchResponse, TrieVisualNode, CleanOptions, CleanResult, WordEntry } from "../types";

export async function fetchStats(): Promise<LexiconStats> {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Error fetching stats");
  return res.json();
}

export async function searchWords(filters: Partial<SearchFilters>): Promise<SearchResponse> {
  const params = new URLSearchParams();
  if (filters.query !== undefined) params.set("query", filters.query);
  if (filters.mode) params.set("mode", filters.mode);
  if (filters.dataset) params.set("dataset", filters.dataset);
  if (filters.minLength !== undefined) params.set("minLength", String(filters.minLength));
  if (filters.maxLength !== undefined) params.set("maxLength", String(filters.maxLength));
  if (filters.hasAccent !== undefined && filters.hasAccent !== null) {
    params.set("hasAccent", String(filters.hasAccent));
  }
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));

  const res = await fetch(`/api/words?${params.toString()}`);
  if (!res.ok) throw new Error("Error searching words");
  return res.json();
}

export async function fetchTrieTree(prefix: string = "", depth: number = 3, children: number = 6): Promise<TrieVisualNode | null> {
  const res = await fetch(`/api/trie/tree?prefix=${encodeURIComponent(prefix)}&depth=${depth}&children=${children}`);
  if (!res.ok) throw new Error("Error fetching trie tree");
  const data = await res.json();
  return data.tree;
}

export async function fetchAutocomplete(prefix: string, limit: number = 6): Promise<{
  prefix: string;
  suggestions: { word: string; frequency: number; isPeruvian: boolean }[];
  nextChars: { char: string; count: number; probability: number }[];
  hasExactMatch: boolean;
}> {
  const res = await fetch(`/api/trie/autocomplete?prefix=${encodeURIComponent(prefix)}&limit=${limit}`);
  if (!res.ok) throw new Error("Error fetching autocomplete");
  return res.json();
}

export async function cleanLexicon(options: Partial<CleanOptions> & { text?: string }): Promise<CleanResult> {
  const res = await fetch("/api/clean", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  if (!res.ok) throw new Error("Error cleaning lexicon");
  return res.json();
}

export async function addCustomWord(data: { word: string; frequency: number; notes?: string; isToponym?: boolean }): Promise<{ success: boolean; entry: WordEntry }> {
  const res = await fetch("/api/custom-word", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error adding custom word");
  return res.json();
}

export async function deleteCustomWord(word: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/custom-word/${encodeURIComponent(word)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error deleting custom word");
  return res.json();
}

export async function compareDiff(customList: string[]): Promise<{
  totalInputWords: number;
  matchedCount: number;
  newWordsCount: number;
  newWords: string[];
  matchedWords: string[];
  sampleMissingInInput: string[];
}> {
  const res = await fetch("/api/diff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customList }),
  });
  if (!res.ok) throw new Error("Error comparing diff");
  return res.json();
}

export async function fetchBinaryStatus(): Promise<{
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
}> {
  const res = await fetch("/api/binary/status");
  if (!res.ok) throw new Error("Error fetching binary status");
  return res.json();
}

export async function compileBinary(): Promise<{
  success: boolean;
  tookMs: number;
  wordCount: number;
  dictSize: number;
  dictSizeKb: string;
  output: string;
}> {
  const res = await fetch("/api/binary/compile", {
    method: "POST",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error compiling binary dictionary");
  }
  return res.json();
}

