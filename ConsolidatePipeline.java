package com.android.inputmethod.latin.makedict;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.*;

public class ConsolidatePipeline {

    private static final Pattern CLEAN_WORD_PATTERN = Pattern.compile("^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+([\\-'][a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+)*$");

    public static void extractFromDict(File f, BufferedWriter writer) {
        try {
            if (!f.exists() || f.length() < 16) return;
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

            System.out.println("Extracting from binary: " + f.getName() + " (size: " + f.length() + " bytes)");
            Ver2DictDecoder decoder = new Ver2DictDecoder(f, bodyOffset, bodyLength, DictDecoder.USE_BYTEARRAY);
            decoder.openDictBuffer();

            long[] count = new long[1];
            Set<Integer> visited = new HashSet<>();
            traverse(decoder, 0, "", writer, count, visited);
            System.out.println("  -> Successfully extracted " + count[0] + " entries from " + f.getName());
        } catch (Throwable t) {
            System.err.println("Error decoding " + f.getName() + ": " + t.getMessage());
        }
    }

    private static void traverse(Ver2DictDecoder decoder, int arrayPos, String prefix, BufferedWriter writer, long[] count, Set<Integer> visited) {
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

                if (info.isTerminal() && currentWord.length() > 0 && currentWord.length() <= FormatSpec.MAX_WORD_LENGTH) {
                    int freq = (info.mProbabilityInfo != null) ? info.mProbabilityInfo.mProbability : 100;
                    if (freq < 1) freq = 1;
                    if (freq > 255) freq = 255;
                    writer.write(currentWord + "\t" + freq + "\n");
                    count[0]++;
                }

                if (BinaryDictIOUtils.hasChildrenAddress(info.mFlags) && info.mChildrenAddress > 0) {
                    traverse(decoder, info.mChildrenAddress, currentWord, writer, count, visited);
                }

                currentPos = info.mEndAddress;
            }
        } catch (Exception e) {
            // End of valid subtree branch
        }
    }

    public static void extractFromTextFile(File f, BufferedWriter writer) {
        if (!f.exists()) return;
        System.out.println("Reading text source: " + f.getName());
        long count = 0;
        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(f), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#") || line.startsWith("dictionary=")) continue;

                String word = null;
                int freq = 100;

                if (line.startsWith("word=")) {
                    // AOSP combined format: word=xxx,f=yyy
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
                    // Hunspell format: word/flags
                    word = line.split("/")[0].trim();
                } else {
                    // Plain word
                    word = line;
                }

                if (word != null && !word.isEmpty() && word.length() <= FormatSpec.MAX_WORD_LENGTH) {
                    writer.write(word + "\t" + freq + "\n");
                    count++;
                }
            }
            System.out.println("  -> Successfully read " + count + " entries from " + f.getName());
        } catch (Exception e) {
            System.err.println("Error reading " + f.getName() + ": " + e.getMessage());
        }
    }

    public static void main(String[] args) throws Exception {
        File rawDump = new File("all_extracted_raw.tsv");
        try (BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(rawDump), StandardCharsets.UTF_8), 1024 * 1024)) {
            // 1. Extract from all .dict binary files
            String[] dictFiles = {"main_es.dict", "main_es (1).dict", "main_es_PE.dict", "test.dict", "test1.dict", "test2.dict"};
            for (String df : dictFiles) {
                extractFromDict(new File(df), bw);
            }

            // 2. Extract from all text sources
            String[] textFiles = {"es.dic", "es_PE.txt", "es_PE_wordlist.combined", "words_input.txt", "test.combined", "test1.combined", "test2.combined"};
            for (String tf : textFiles) {
                extractFromTextFile(new File(tf), bw);
            }
        }
        System.out.println("All raw extractions dumped to " + rawDump.getAbsolutePath());
    }
}
