package com.android.inputmethod.latin.makedict;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

public class BuildConsolidatedDictionary {

    private static final Pattern VALID_WORD_PATTERN = Pattern.compile("^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+([\\-'][a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+)*$");
    private static final Map<String, Integer> MASTER_LEXICON = new TreeMap<>();

    private static void recordWord(String rawWord, int freq) {
        if (rawWord == null) return;
        String word = Normalizer.normalize(rawWord.trim(), Normalizer.Form.NFC);
        if (word.isEmpty() || word.length() > FormatSpec.MAX_WORD_LENGTH) return;
        if (!VALID_WORD_PATTERN.matcher(word).matches()) return;

        int clampedFreq = Math.max(1, Math.min(255, freq));
        Integer existing = MASTER_LEXICON.get(word);
        if (existing == null || clampedFreq > existing) {
            MASTER_LEXICON.put(word, clampedFreq);
        }
    }

    public static void extractFromBinary(File f) {
        if (!f.exists() || f.length() < 16) return;
        try {
            RandomAccessFile raf = new RandomAccessFile(f, "r");
            int magic = raf.readInt();
            if (magic != FormatSpec.MAGIC_NUMBER) {
                raf.close();
                return;
            }
            int version = raf.readUnsignedShort();
            int options = raf.readUnsignedShort();
            int headerSize = raf.readInt();
            int bodyOffset = 12 + headerSize;
            long bodyLength = f.length() - bodyOffset;
            raf.close();

            if (bodyLength <= 0) return;

            System.out.println("Processing binary dict: " + f.getName() + " (" + f.length() + " bytes)...");
            Ver2DictDecoder decoder = new Ver2DictDecoder(f, bodyOffset, bodyLength, DictDecoder.USE_BYTEARRAY);
            decoder.openDictBuffer();

            int before = MASTER_LEXICON.size();
            Set<Integer> visited = new HashSet<>();
            traverse(decoder, 0, "", visited);
            int added = MASTER_LEXICON.size() - before;
            System.out.println("  + Added " + added + " unique words from " + f.getName() + " (pool total: " + MASTER_LEXICON.size() + ")");
        } catch (Throwable t) {
            System.err.println("  ! Warning reading " + f.getName() + ": " + t.getMessage());
        }
    }

    private static void traverse(Ver2DictDecoder decoder, int arrayPos, String prefix, Set<Integer> visited) {
        if (prefix.length() > FormatSpec.MAX_WORD_LENGTH) return;
        if (!visited.add(arrayPos)) return;

        try {
            decoder.setPosition(arrayPos);
            int nodeCount = decoder.readPtNodeCount();
            int currentPos = decoder.getPosition();

            for (int i = 0; i < nodeCount; i++) {
                decoder.setPosition(currentPos);
                PtNodeInfo info = decoder.readPtNode(currentPos);
                StringBuilder sb = new StringBuilder(prefix);
                if (info.mCharacters != null) {
                    for (int cp : info.mCharacters) {
                        sb.appendCodePoint(cp);
                    }
                }
                String currentWord = sb.toString();

                if (info.isTerminal()) {
                    int freq = (info.mProbabilityInfo != null) ? info.mProbabilityInfo.mProbability : 100;
                    recordWord(currentWord, freq);
                }

                if (BinaryDictIOUtils.hasChildrenAddress(info.mFlags) && info.mChildrenAddress > 0) {
                    traverse(decoder, info.mChildrenAddress, currentWord, visited);
                }

                currentPos = info.mEndAddress;
            }
        } catch (Exception e) {
            // Leaf boundary reached
        }
    }

    public static void extractFromText(File f) {
        if (!f.exists()) return;
        System.out.println("Processing text source: " + f.getName() + " (" + f.length() + " bytes)...");
        int before = MASTER_LEXICON.size();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(f), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#") || line.startsWith("dictionary=")) continue;

                String word = null;
                int freq = 100;

                if (line.startsWith("word=")) {
                    String[] parts = line.split(",");
                    for (String p : parts) {
                        if (p.startsWith("word=")) {
                            word = p.substring(5);
                        } else if (p.startsWith("f=")) {
                            try {
                                freq = Integer.parseInt(p.substring(2));
                            } catch (Exception ignored) {}
                        }
                    }
                } else if (line.contains("\t")) {
                    String[] parts = line.split("\t");
                    word = parts[0].trim();
                    if (parts.length > 1) {
                        try {
                            freq = Integer.parseInt(parts[1].trim());
                        } catch (Exception ignored) {}
                    }
                } else if (line.contains("/")) {
                    word = line.split("/")[0].trim();
                } else {
                    word = line;
                }

                if (word != null) {
                    recordWord(word, freq);
                }
            }
            int added = MASTER_LEXICON.size() - before;
            System.out.println("  + Added " + added + " unique words from " + f.getName() + " (pool total: " + MASTER_LEXICON.size() + ")");
        } catch (Exception e) {
            System.err.println("  ! Warning reading " + f.getName() + ": " + e.getMessage());
        }
    }

    public static void main(String[] args) throws Exception {
        System.out.println("==================================================================");
        System.out.println("AOSP / FUTO CONSOLIDATED DICTIONARY BUILDER");
        System.out.println("==================================================================");

        // 1. Ingest existing binaries
        String[] binaries = {"main_es (1).dict", "main_es.dict", "main_es_PE.dict", "test.dict", "test1.dict", "test2.dict"};
        for (String b : binaries) {
            extractFromBinary(new File(b));
        }

        // 2. Ingest text sources
        String[] texts = {"es.dic", "es_PE.txt", "es_PE_wordlist.combined", "words_input.txt", "test.combined", "test1.combined", "test2.combined"};
        for (String t : texts) {
            extractFromText(new File(t));
        }

        System.out.println("------------------------------------------------------------------");
        System.out.println("Consolidation & Normalization finished.");
        System.out.println("Total Unique Clean Words in Master Lexicon: " + MASTER_LEXICON.size());
        System.out.println("------------------------------------------------------------------");

        // 3. Write main_es.combined
        File combinedOut = new File("main_es.combined");
        System.out.println("Writing consolidated wordlist to " + combinedOut.getName() + "...");
        long epoch = System.currentTimeMillis() / 1000L;
        try (BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(combinedOut), StandardCharsets.UTF_8), 2 * 1024 * 1024)) {
            bw.write("dictionary=main:es,locale=es,description=Spanish Consolidated Modern AOSP/FUTO Dictionary,date=" + epoch + ",version=1\n");
            for (Map.Entry<String, Integer> entry : MASTER_LEXICON.entrySet()) {
                bw.write(" word=" + entry.getKey() + ",f=" + entry.getValue() + "\n");
            }
        }
        System.out.println("File " + combinedOut.getName() + " generated successfully (" + combinedOut.length() + " bytes).");
        System.out.println("==================================================================");
    }
}
