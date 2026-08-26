import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { createServer as createViteServer } from "vite";
import { WordEntry, LexiconStats, TrieVisualNode, CleanOptions, CleanResult } from "./src/types.js";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// In-Memory Storage & Indexes
interface RawItem {
  clean: string;
  raw: string;
  flags: string;
  freq: number;
}

const peruvianMap = new Map<string, RawItem>();
const generalSet = new Set<string>();
const customWordsMap = new Map<string, WordEntry>();

let allUniqueWords: string[] = [];
let cachedStats: LexiconStats | null = null;

// Initialize datasets
function loadDictionaries() {
  console.log("[Mi Diccionario] Loading dictionary files...");
  const startTime = Date.now();

  try {
    const pePath = path.join(process.cwd(), "es_PE.txt");
    if (fs.existsSync(pePath)) {
      const peContent = fs.readFileSync(pePath, "utf8");
      const lines = peContent.split(/\r?\n/);
      // First line in some dic formats might be count or header, skip empty
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || (i === 0 && /^\d+$/.test(line))) continue;

        // Parse word and flags
        const slashIdx = line.indexOf("/");
        let cleanWord = line;
        let flags = "";
        if (slashIdx !== -1) {
          cleanWord = line.substring(0, slashIdx).trim();
          flags = line.substring(slashIdx + 1).trim();
        }

        if (cleanWord) {
          peruvianMap.set(cleanWord, {
            clean: cleanWord,
            raw: line,
            flags,
            freq: 100,
          });
        }
      }
      console.log(`[Mi Diccionario] Loaded ${peruvianMap.size} Peruvian Spanish entries.`);
    }

    const esPath = path.join(process.cwd(), "es.dic");
    if (fs.existsSync(esPath)) {
      const esContent = fs.readFileSync(esPath, "utf8");
      const lines = esContent.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || (i === 0 && /^\d+$/.test(line))) continue;

        const slashIdx = line.indexOf("/");
        const cleanWord = slashIdx !== -1 ? line.substring(0, slashIdx).trim() : line;
        if (cleanWord) {
          generalSet.add(cleanWord);
        }
      }
      console.log(`[Mi Diccionario] Loaded ${generalSet.size} General Spanish entries.`);
    }

    // Combine unique list
    const combinedSet = new Set<string>([...peruvianMap.keys(), ...generalSet]);
    allUniqueWords = Array.from(combinedSet).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );

    computeStats();
    console.log(`[Mi Diccionario] Dictionaries indexed in ${Date.now() - startTime}ms. Total distinct words: ${allUniqueWords.length}`);
  } catch (err) {
    console.error("[Mi Diccionario] Error loading dictionaries:", err);
  }
}

function computeStats(): LexiconStats {
  const totalPeruvian = peruvianMap.size + customWordsMap.size;
  const totalGeneral = generalSet.size;

  let exclusivePeruvian = 0;
  let exclusiveGeneral = 0;
  let sharedCount = 0;
  let accentedWordsCount = 0;
  let totalLength = 0;

  const letterDistribution: Record<string, number> = {};
  const lengthDistribution: Record<number, number> = {};
  const initialLetters: Record<string, number> = {};
  const flagDistribution: Record<string, number> = {};

  const accentRegex = /[áéíóúÁÉÍÓÚñÑüÜ]/;

  for (const [word, item] of peruvianMap.entries()) {
    if (generalSet.has(word)) {
      sharedCount++;
    } else {
      exclusivePeruvian++;
    }

    if (item.flags) {
      flagDistribution[item.flags] = (flagDistribution[item.flags] || 0) + 1;
    }
  }

  for (const word of generalSet) {
    if (!peruvianMap.has(word)) {
      exclusiveGeneral++;
    }
  }

  for (const word of allUniqueWords) {
    totalLength += word.length;
    lengthDistribution[word.length] = (lengthDistribution[word.length] || 0) + 1;

    if (accentRegex.test(word)) {
      accentedWordsCount++;
    }

    const firstChar = word.charAt(0).toUpperCase();
    if (firstChar) {
      initialLetters[firstChar] = (initialLetters[firstChar] || 0) + 1;
    }

    for (const ch of word.toLowerCase()) {
      letterDistribution[ch] = (letterDistribution[ch] || 0) + 1;
    }
  }

  const topInitialLetters = Object.entries(initialLetters)
    .sort((a, b) => b[1] - a[1])
    .map(([letter, count]) => ({
      letter,
      count,
      percentage: Number(((count / (allUniqueWords.length || 1)) * 100).toFixed(1)),
    }));

  cachedStats = {
    totalPeruvian,
    totalGeneral,
    totalUniqueAll: allUniqueWords.length,
    exclusivePeruvian,
    exclusiveGeneral,
    sharedCount,
    customAddedCount: customWordsMap.size,
    avgLength: Number((totalLength / (allUniqueWords.length || 1)).toFixed(2)),
    letterDistribution,
    lengthDistribution,
    topInitialLetters,
    accentedWordsCount,
    flagDistribution,
  };

  return cachedStats;
}

// Toponyms & Peruvian regionalism helpers
const knownPeruvianToponyms = new Set([
  "Abancay", "Acobamba", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Chachapoyas",
  "Chiclayo", "Chimbote", "Cusco", "Cuzco", "Huancavelica", "Huancayo", "Huánuco",
  "Huaraz", "Ica", "Iquitos", "Jauja", "Juliaca", "Lima", "Moquegua", "Moyobamba",
  "Pasco", "Pisco", "Piura", "Pucallpa", "Puno", "Tacna", "Tarapoto", "Trujillo",
  "Tumbes", "Ucayali", "Amazonas", "Ancash", "Apurímac", "Loreto", "Madre de Dios",
  "San Martín", "Machu Picchu", "Ollantaytambo", "Pisac", "Máncora", "Paracas",
  "Colca", "Alpamayo", "Huascarán", "Ausangate", "Titikaka", "Titicaca", "Huayhuash",
  "Acolla", "Acocro", "Acochaca", "Acobambilla", "Achoma", "Achaya", "Accomarca",
  "Accha", "Acaya", "Acas", "Acarí", "Anta", "Andahuaylas", "Chincha", "Nazca", "Sicuani"
]);

function createWordEntry(cleanWord: string): WordEntry {
  const inPE = peruvianMap.has(cleanWord) || customWordsMap.has(cleanWord);
  const inES = generalSet.has(cleanWord);
  const custom = customWordsMap.get(cleanWord);
  const peItem = peruvianMap.get(cleanWord);

  const isToponym =
    knownPeruvianToponyms.has(cleanWord) ||
    (inPE && !inES && /^[A-ZÁÉÍÓÚ]/.test(cleanWord) && (cleanWord.endsWith("ay") || cleanWord.endsWith("bamba") || cleanWord.endsWith("marca") || cleanWord.endsWith("co")));

  const hasAccent = /[áéíóúÁÉÍÓÚñÑüÜ]/.test(cleanWord);

  const tags: string[] = [];
  if (isToponym) tags.push("Topónimo Peruano");
  if (inPE && !inES) tags.push("Peruanismo / Regional");
  if (custom) tags.push("Personalizado");
  if (peItem?.flags) tags.push(`Flag: /${peItem.flags}`);

  return {
    id: cleanWord,
    word: custom?.word || peItem?.raw || cleanWord,
    cleanWord,
    rawLine: peItem?.raw || cleanWord,
    flags: peItem?.flags || "",
    frequency: custom?.frequency || peItem?.freq || 100,
    length: cleanWord.length,
    inPeruvian: inPE,
    inGeneral: inES,
    isToponym,
    isRegional: inPE && !inES,
    isCustom: !!custom,
    hasAccent,
    tags,
    notes: custom?.notes || (isToponym ? "Lugar / Región del Perú" : inPE && !inES ? "Término característico del léxico peruano" : "Español estándar"),
  };
}

// Trie implementation for visualizer and keyboard prediction
class TrieNode {
  char: string;
  isWord: boolean = false;
  frequency: number = 0;
  wordCount: number = 0;
  children: Map<string, TrieNode> = new Map();

  constructor(char: string = "") {
    this.char = char;
  }
}

class Trie {
  root: TrieNode = new TrieNode();

  insert(word: string, frequency: number = 100) {
    let curr = this.root;
    curr.wordCount++;

    for (const ch of word) {
      if (!curr.children.has(ch)) {
        curr.children.set(ch, new TrieNode(ch));
      }
      curr = curr.children.get(ch)!;
      curr.wordCount++;
    }

    curr.isWord = true;
    curr.frequency = frequency;
  }

  getPrefixNode(prefix: string): TrieNode | null {
    let curr = this.root;
    for (const ch of prefix) {
      if (!curr.children.has(ch)) {
        return null;
      }
      curr = curr.children.get(ch)!;
    }
    return curr;
  }

  findSuggestions(prefix: string, maxResults: number = 10): { word: string; frequency: number; isPeruvian: boolean }[] {
    const results: { word: string; frequency: number; isPeruvian: boolean }[] = [];
    const node = this.getPrefixNode(prefix);
    if (!node) return results;

    const dfs = (curr: TrieNode, currentWord: string) => {
      if (results.length >= maxResults * 3) return; // Gather candidates
      if (curr.isWord) {
        results.push({
          word: currentWord,
          frequency: curr.frequency,
          isPeruvian: peruvianMap.has(currentWord) || customWordsMap.has(currentWord),
        });
      }
      for (const [char, child] of curr.children.entries()) {
        dfs(child, currentWord + char);
      }
    };

    dfs(node, prefix);

    return results
      .sort((a, b) => {
        // Boost exact matching / Peruvian regionalisms
        if (a.isPeruvian !== b.isPeruvian) return a.isPeruvian ? -1 : 1;
        return a.word.length - b.word.length || b.frequency - a.frequency;
      })
      .slice(0, maxResults);
  }

  getVisualSubtree(prefix: string, maxDepth: number = 3, maxChildrenPerNode: number = 6): TrieVisualNode | null {
    const startNode = prefix ? this.getPrefixNode(prefix) : this.root;
    if (!startNode) return null;

    const buildVisual = (curr: TrieNode, currentPrefix: string, depth: number): TrieVisualNode => {
      const childNodes: TrieVisualNode[] = [];
      if (depth < maxDepth) {
        const sortedChildren = Array.from(curr.children.entries())
          .sort((a, b) => b[1].wordCount - a[1].wordCount)
          .slice(0, maxChildrenPerNode);

        for (const [ch, child] of sortedChildren) {
          childNodes.push(buildVisual(child, currentPrefix + ch, depth + 1));
        }
      }

      return {
        char: curr.char || (prefix ? prefix.charAt(prefix.length - 1) : "ROOT"),
        fullPrefix: currentPrefix,
        isWord: curr.isWord,
        frequency: curr.frequency,
        wordCount: curr.wordCount,
        children: childNodes,
      };
    };

    return buildVisual(startNode, prefix, 0);
  }
}

const peTrie = new Trie();
let isTrieBuilt = false;

function buildTrieIfNeeded() {
  if (isTrieBuilt) return;
  console.log("[Mi Diccionario] Building Trie index for AOSP search...");
  const t0 = Date.now();
  for (const [word, item] of peruvianMap.entries()) {
    peTrie.insert(word, item.freq);
  }
  for (const [word, item] of customWordsMap.entries()) {
    peTrie.insert(word, item.frequency);
  }
  isTrieBuilt = true;
  console.log(`[Mi Diccionario] Trie built in ${Date.now() - t0}ms.`);
}

// ---------------- API ROUTES ----------------

// Statistics
app.get("/api/stats", (req: Request, res: Response) => {
  if (!cachedStats) {
    computeStats();
  }
  res.json(cachedStats);
});

// Search and filter words
app.get("/api/words", (req: Request, res: Response) => {
  const startTime = Date.now();
  const query = ((req.query.query as string) || "").trim();
  const mode = (req.query.mode as string) || "contains";
  const dataset = (req.query.dataset as string) || "all";
  const minLength = req.query.minLength ? parseInt(req.query.minLength as string, 10) : undefined;
  const maxLength = req.query.maxLength ? parseInt(req.query.maxLength as string, 10) : undefined;
  const hasAccent = req.query.hasAccent === "true" ? true : req.query.hasAccent === "false" ? false : null;
  const sortBy = (req.query.sortBy as string) || "word";
  const sortOrder = (req.query.sortOrder as string) || "asc";
  const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
  const pageSize = Math.min(100, Math.max(10, parseInt((req.query.pageSize as string) || "50", 10)));

  // Target pool based on dataset
  let candidateWords: string[] = [];

  if (dataset === "pe_only") {
    candidateWords = Array.from(peruvianMap.keys());
  } else if (dataset === "es_only") {
    candidateWords = Array.from(generalSet);
  } else if (dataset === "shared") {
    candidateWords = Array.from(peruvianMap.keys()).filter((w) => generalSet.has(w));
  } else if (dataset === "exclusive_pe") {
    candidateWords = Array.from(peruvianMap.keys()).filter((w) => !generalSet.has(w));
  } else if (dataset === "custom") {
    candidateWords = Array.from(customWordsMap.keys());
  } else {
    candidateWords = allUniqueWords;
  }

  // Regex setup if needed
  let regex: RegExp | null = null;
  if (query) {
    try {
      if (mode === "regex") {
        regex = new RegExp(query, "i");
      }
    } catch {
      regex = null;
    }
  }

  const accentRegex = /[áéíóúÁÉÍÓÚñÑüÜ]/;
  const lowerQuery = query.toLowerCase();

  // Filter
  const filtered = candidateWords.filter((w) => {
    // Length filters
    if (minLength !== undefined && w.length < minLength) return false;
    if (maxLength !== undefined && w.length > maxLength) return false;

    // Accent filter
    if (hasAccent !== null) {
      const containsAccent = accentRegex.test(w);
      if (hasAccent !== containsAccent) return false;
    }

    // Query filters
    if (!query) return true;

    const lowerWord = w.toLowerCase();

    if (mode === "exact") {
      return lowerWord === lowerQuery || w === query;
    }
    if (mode === "startsWith") {
      return lowerWord.startsWith(lowerQuery);
    }
    if (mode === "endsWith") {
      return lowerWord.endsWith(lowerQuery);
    }
    if (mode === "regex" && regex) {
      return regex.test(w);
    }
    // Default 'contains'
    return lowerWord.includes(lowerQuery);
  });

  // Sorting
  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortBy === "length") {
      comparison = a.length - b.length;
    } else if (sortBy === "frequency") {
      const fa = customWordsMap.get(a)?.frequency || peruvianMap.get(a)?.freq || 100;
      const fb = customWordsMap.get(b)?.frequency || peruvianMap.get(b)?.freq || 100;
      comparison = fa - fb;
    } else {
      comparison = a.localeCompare(b, "es", { sensitivity: "base" });
    }
    return sortOrder === "desc" ? -comparison : comparison;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const offset = (page - 1) * pageSize;
  const pagedWords = filtered.slice(offset, offset + pageSize).map((w) => createWordEntry(w));

  const tookMs = Date.now() - startTime;

  res.json({
    words: pagedWords,
    total,
    page,
    pageSize,
    totalPages,
    tookMs,
  });
});

// Trie visual subtree
app.get("/api/trie/tree", (req: Request, res: Response) => {
  buildTrieIfNeeded();
  const prefix = ((req.query.prefix as string) || "").trim();
  const maxDepth = parseInt((req.query.depth as string) || "3", 10);
  const maxChildren = parseInt((req.query.children as string) || "6", 10);

  const tree = peTrie.getVisualSubtree(prefix, maxDepth, maxChildren);
  res.json({ tree });
});

// Autocomplete suggestions & next-character simulation
app.get("/api/trie/autocomplete", (req: Request, res: Response) => {
  buildTrieIfNeeded();
  const prefix = ((req.query.prefix as string) || "").trim();
  const limit = parseInt((req.query.limit as string) || "6", 10);

  if (!prefix) {
    return res.json({ suggestions: [], nextChars: [] });
  }

  const suggestions = peTrie.findSuggestions(prefix, limit);
  const node = peTrie.getPrefixNode(prefix);

  const nextChars: { char: string; count: number; probability: number }[] = [];
  if (node) {
    let totalNext = 0;
    for (const [, child] of node.children.entries()) {
      totalNext += child.wordCount;
    }
    for (const [ch, child] of node.children.entries()) {
      nextChars.push({
        char: ch,
        count: child.wordCount,
        probability: totalNext > 0 ? Math.round((child.wordCount / totalNext) * 100) : 0,
      });
    }
    nextChars.sort((a, b) => b.count - a.count);
  }

  res.json({
    prefix,
    suggestions,
    nextChars,
    hasExactMatch: node ? node.isWord : false,
  });
});

// Clean and compile lexicon text (replicates and extends build_es_PE_dict.sh logic)
app.post("/api/clean", (req: Request, res: Response) => {
  const {
    text,
    stripFlags = true,
    customRegex = "/[A-Z]*",
    defaultFrequency = 100,
    frequencyRule = "uniform",
    removeDuplicates = true,
    sortAlphabetically = true,
    customWords = [],
  }: {
    text?: string;
    stripFlags?: boolean;
    customRegex?: string;
    defaultFrequency?: number;
    frequencyRule?: "uniform" | "length_weighted" | "custom_curve";
    removeDuplicates?: boolean;
    sortAlphabetically?: boolean;
    customWords?: string[];
  } = req.body;

  let sourceText = text;
  if (!sourceText) {
    // Default to es_PE.txt content
    const pePath = path.join(process.cwd(), "es_PE.txt");
    if (fs.existsSync(pePath)) {
      sourceText = fs.readFileSync(pePath, "utf8");
    } else {
      sourceText = "";
    }
  }

  const lines = sourceText.split(/\r?\n/);
  const originalLinesCount = lines.length;

  let cleanedWords: { word: string; freq: number }[] = [];
  const seen = new Set<string>();
  let duplicatesRemoved = 0;

  // Compile regex for flags
  let flagReg: RegExp;
  try {
    flagReg = new RegExp(customRegex.startsWith("/") ? customRegex.slice(1, -1) : customRegex, "g");
  } catch {
    flagReg = /\/[A-Z]*/g;
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    // Skip header count if on line 0
    if (i === 0 && /^\d+$/.test(raw)) continue;

    let word = raw;
    if (stripFlags) {
      word = word.replace(flagReg, "").trim();
      const slashIndex = word.indexOf("/");
      if (slashIndex !== -1) {
        word = word.substring(0, slashIndex).trim();
      }
    }

    if (!word) continue;

    if (removeDuplicates) {
      if (seen.has(word)) {
        duplicatesRemoved++;
        continue;
      }
      seen.add(word);
    }

    // Determine frequency
    let freq = defaultFrequency;
    if (frequencyRule === "length_weighted") {
      // Shorter common words (3-5 chars) get higher AOSP probability
      if (word.length <= 4) freq = Math.min(255, defaultFrequency + 40);
      else if (word.length <= 7) freq = defaultFrequency;
      else freq = Math.max(20, defaultFrequency - 20);
    } else if (frequencyRule === "custom_curve") {
      freq = Math.max(10, Math.min(255, Math.round(250 / Math.sqrt(word.length + 1))));
    }

    cleanedWords.push({ word, freq });
  }

  // Include custom additions
  if (customWords && Array.isArray(customWords)) {
    for (const cw of customWords) {
      const trimmed = cw.trim();
      if (trimmed && (!removeDuplicates || !seen.has(trimmed))) {
        seen.add(trimmed);
        cleanedWords.push({ word: trimmed, freq: defaultFrequency });
      }
    }
  }

  if (sortAlphabetically) {
    cleanedWords.sort((a, b) => a.word.localeCompare(b.word, "es", { sensitivity: "base" }));
  }

  const formattedLines = cleanedWords.map((item) => `${item.word} ,f=${item.freq}`);
  const formattedOutput = formattedLines.join("\n");
  const fileSizeEstimateKb = Number((Buffer.byteLength(formattedOutput, "utf8") / 1024).toFixed(1));

  const result: CleanResult = {
    originalLinesCount,
    cleanedCount: cleanedWords.length,
    duplicatesRemoved,
    sampleLines: formattedLines.slice(0, 30),
    formattedOutput: formattedOutput.length > 500000 ? formattedOutput.slice(0, 500000) + "\n...[truncated for preview]" : formattedOutput,
    fileSizeEstimateKb,
  };

  res.json(result);
});

// Add / Update custom Peruvian word
app.post("/api/custom-word", (req: Request, res: Response) => {
  const { word, frequency = 120, notes = "", isToponym = false } = req.body;
  if (!word || typeof word !== "string") {
    return res.status(400).json({ error: "Palabra inválida" });
  }

  const clean = word.trim();
  const entry: WordEntry = {
    id: clean,
    word: clean,
    cleanWord: clean,
    rawLine: clean,
    frequency: Number(frequency) || 100,
    length: clean.length,
    inPeruvian: true,
    inGeneral: generalSet.has(clean),
    isToponym: Boolean(isToponym),
    isRegional: true,
    isCustom: true,
    hasAccent: /[áéíóúÁÉÍÓÚñÑüÜ]/.test(clean),
    tags: ["Personalizado", ...(isToponym ? ["Topónimo"] : ["Peruanismo"])],
    notes,
  };

  customWordsMap.set(clean, entry);
  if (!allUniqueWords.includes(clean)) {
    allUniqueWords.push(clean);
    allUniqueWords.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }

  peTrie.insert(clean, entry.frequency);
  computeStats();

  res.json({ success: true, entry });
});

// Delete custom word
app.delete("/api/custom-word/:word", (req: Request, res: Response) => {
  const target = req.params.word;
  customWordsMap.delete(target);
  computeStats();
  res.json({ success: true });
});

// Compare two lists / Diff
app.post("/api/diff", (req: Request, res: Response) => {
  const { customList = [] }: { customList: string[] } = req.body;
  const inputWords = new Set(
    customList
      .map((w) => w.trim().replace(/\/[A-Z]*/g, ""))
      .filter(Boolean)
  );

  const onlyInInput: string[] = [];
  const inBoth: string[] = [];
  const onlyInPeruvian: string[] = [];

  for (const w of inputWords) {
    if (peruvianMap.has(w) || customWordsMap.has(w)) {
      inBoth.push(w);
    } else {
      onlyInInput.push(w);
    }
  }

  const sampleMissingInInput = Array.from(peruvianMap.keys())
    .filter((w) => !inputWords.has(w))
    .slice(0, 50);

  res.json({
    totalInputWords: inputWords.size,
    matchedCount: inBoth.length,
    newWordsCount: onlyInInput.length,
    newWords: onlyInInput.slice(0, 100),
    matchedWords: inBoth.slice(0, 100),
    sampleMissingInInput,
  });
});

// Binary dictionary status and compilation endpoints
app.get("/api/binary/status", (req: Request, res: Response) => {
  const dictPath = path.join(process.cwd(), "main_es_PE.dict");
  const combinedPath = path.join(process.cwd(), "es_PE_wordlist.combined");

  const dictExists = fs.existsSync(dictPath);
  const combinedExists = fs.existsSync(combinedPath);

  let dictSize = 0;
  let dictModified = 0;
  let magicHex = "";

  if (dictExists) {
    const stats = fs.statSync(dictPath);
    dictSize = stats.size;
    dictModified = stats.mtimeMs;
    try {
      const fd = fs.openSync(dictPath, "r");
      const buffer = Buffer.alloc(4);
      fs.readSync(fd, buffer, 0, 4, 0);
      fs.closeSync(fd);
      magicHex = buffer.toString("hex");
    } catch (e) {
      // ignore
    }
  }

  let combinedSize = 0;
  let wordCount = 0;
  if (combinedExists) {
    const cStats = fs.statSync(combinedPath);
    combinedSize = cStats.size;
  }

  res.json({
    dictExists,
    dictSize,
    dictSizeKb: (dictSize / 1024).toFixed(1),
    dictModified,
    magicHex,
    isMagicValid: magicHex.toLowerCase() === "9bc13afe",
    combinedExists,
    combinedSize,
    combinedSizeKb: (combinedSize / 1024).toFixed(1),
    locale: "es_PE",
    commandUsed: "java -jar dicttool_aosp.jar makedict -s es_PE_wordlist.combined -d main_es_PE.dict",
  });
});

app.post("/api/binary/compile", (req: Request, res: Response) => {
  const t0 = Date.now();
  const dictPath = path.join(process.cwd(), "main_es_PE.dict");
  const combinedPath = path.join(process.cwd(), "es_PE_wordlist.combined");
  const jarPath = path.join(process.cwd(), "dicttool_aosp.jar");

  // Collect words
  const words = Array.from(new Set([...peruvianMap.keys(), ...customWordsMap.keys()]));
  words.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "case" }));

  // Header standard for AOSP LatinIME / FUTO
  const timestamp = Math.floor(Date.now() / 1000);
  const header = [
    `dictionary=main:es_PE,locale=es_PE,description=Spanish (Peru) Dictionary for FUTO / AOSP,date=${timestamp},version=1`
  ];

  const wordEntries = words.map((w) => {
    const freq = customWordsMap.get(w)?.frequency || peruvianMap.get(w)?.freq || 100;
    return ` word=${w},f=${freq}`;
  });

  const combinedContent = header.concat(wordEntries).join("\n") + "\n";
  fs.writeFileSync(combinedPath, combinedContent, "utf8");

  try {
    const output = execSync(`java -jar "${jarPath}" makedict -s "${combinedPath}" -d "${dictPath}"`, {
      encoding: "utf8",
      timeout: 30000,
    });

    const dictStats = fs.statSync(dictPath);
    res.json({
      success: true,
      tookMs: Date.now() - t0,
      wordCount: words.length,
      dictSize: dictStats.size,
      dictSizeKb: (dictStats.size / 1024).toFixed(1),
      output,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Error al compilar el diccionario binario",
      stderr: err.stderr?.toString() || "",
    });
  }
});

app.get("/api/download/binary", (req: Request, res: Response) => {
  const dictPath = path.join(process.cwd(), "main_es_PE.dict");
  if (!fs.existsSync(dictPath)) {
    return res.status(404).send("El archivo binario main_es_PE.dict aún no ha sido generado.");
  }
  res.setHeader("Content-Disposition", 'attachment; filename="main_es_PE.dict"');
  res.setHeader("Content-Type", "application/octet-stream");
  fs.createReadStream(dictPath).pipe(res);
});

app.get("/api/download/combined", (req: Request, res: Response) => {
  const combinedPath = path.join(process.cwd(), "es_PE_wordlist.combined");
  if (!fs.existsSync(combinedPath)) {
    return res.status(404).send("El archivo es_PE_wordlist.combined aún no ha sido generado.");
  }
  res.setHeader("Content-Disposition", 'attachment; filename="es_PE_wordlist.combined"');
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  fs.createReadStream(combinedPath).pipe(res);
});

// Export endpoints
app.get("/api/export/:format", (req: Request, res: Response) => {
  const format = req.params.format;
  const dataset = (req.query.dataset as string) || "pe";

  let words: string[] = [];
  if (dataset === "pe") {
    words = Array.from(new Set([...peruvianMap.keys(), ...customWordsMap.keys()]));
  } else if (dataset === "es") {
    words = Array.from(generalSet);
  } else {
    words = allUniqueWords;
  }

  words.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

  if (format === "aosp") {
    // AOSP / FUTO format: word ,f=100
    const lines = words.map((w) => {
      const freq = customWordsMap.get(w)?.frequency || peruvianMap.get(w)?.freq || 100;
      return `${w} ,f=${freq}`;
    });
    res.setHeader("Content-Disposition", `attachment; filename="${dataset}_aosp_dict.txt"`);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.send(lines.join("\n"));
  }

  if (format === "hunspell") {
    // Hunspell .dic format: line 1 count, then words
    const lines = [`${words.length}`, ...words];
    res.setHeader("Content-Disposition", `attachment; filename="${dataset}_hunspell.dic"`);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.send(lines.join("\n"));
  }

  if (format === "json") {
    // Structured JSON
    const data = words.map((w) => createWordEntry(w));
    res.setHeader("Content-Disposition", `attachment; filename="${dataset}_dictionary.json"`);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.json(data);
  }

  // Plain word list (.txt)
  res.setHeader("Content-Disposition", `attachment; filename="${dataset}_plain_words.txt"`);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.send(words.join("\n"));
});

// Initialize server
async function startServer() {
  loadDictionaries();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Mi Diccionario] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
