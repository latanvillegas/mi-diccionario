export interface WordEntry {
  id: string;
  word: string;
  cleanWord: string;
  rawLine?: string;
  flags?: string;
  frequency: number;
  length: number;
  inPeruvian: boolean;
  inGeneral: boolean;
  isToponym?: boolean;
  isRegional?: boolean;
  isCustom?: boolean;
  hasAccent?: boolean;
  tags?: string[];
  notes?: string;
}

export interface LexiconStats {
  totalPeruvian: number;
  totalGeneral: number;
  totalUniqueAll: number;
  exclusivePeruvian: number;
  exclusiveGeneral: number;
  sharedCount: number;
  customAddedCount: number;
  avgLength: number;
  letterDistribution: Record<string, number>;
  lengthDistribution: Record<number, number>;
  topInitialLetters: { letter: string; count: number; percentage: number }[];
  accentedWordsCount: number;
  flagDistribution: Record<string, number>;
}

export interface SearchFilters {
  query: string;
  mode: 'contains' | 'startsWith' | 'endsWith' | 'exact' | 'regex';
  dataset: 'all' | 'pe_only' | 'es_only' | 'shared' | 'custom';
  minLength?: number;
  maxLength?: number;
  hasAccent?: boolean | null;
  sortBy: 'word' | 'length' | 'frequency';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface SearchResponse {
  words: WordEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  tookMs: number;
}

export interface TrieVisualNode {
  char: string;
  fullPrefix: string;
  isWord: boolean;
  frequency: number;
  wordCount: number;
  children: TrieVisualNode[];
}

export interface SuggestionResult {
  word: string;
  frequency: number;
  isPeruvian: boolean;
  score: number;
}

export interface CleanOptions {
  stripFlags: boolean;
  customRegex?: string;
  defaultFrequency: number;
  frequencyRule: 'uniform' | 'length_weighted' | 'custom_curve';
  removeDuplicates: boolean;
  sortAlphabetically: boolean;
  includeToponyms: boolean;
  customWords?: string[];
}

export interface CleanResult {
  originalLinesCount: number;
  cleanedCount: number;
  duplicatesRemoved: number;
  sampleLines: string[];
  formattedOutput: string;
  fileSizeEstimateKb: number;
}
