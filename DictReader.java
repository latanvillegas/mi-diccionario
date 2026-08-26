
package com.android.inputmethod.latin.makedict;

import java.io.File;
import java.io.RandomAccessFile;
import java.util.*;

public class DictReader {
    static Map<String, Integer> wordFreqMap = new HashMap<>();

    public static void traverse(Ver2DictDecoder decoder, int arrayPos, String prefix) {
        try {
            decoder.setPosition(arrayPos);
            int count = decoder.readPtNodeCount();
            int currentPos = decoder.getPosition();

            for (int i = 0; i < count; i++) {
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
                    Integer existing = wordFreqMap.get(currentWord);
                    if (existing == null || freq > existing) {
                        wordFreqMap.put(currentWord, freq);
                    }
                }

                if (BinaryDictIOUtils.hasChildrenAddress(info.mFlags) && info.mChildrenAddress > 0) {
                    traverse(decoder, info.mChildrenAddress, currentWord);
                }

                currentPos = info.mEndAddress;
            }
        } catch (Exception e) {
            // System.err.println("Error at pos " + arrayPos + ": " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        for (String filename : args) {
            try {
                File f = new File(filename);
                if (!f.exists()) {
                    System.out.println("File not found: " + filename);
                    continue;
                }
                
                RandomAccessFile raf = new RandomAccessFile(f, "r");
                int magic = raf.readInt();
                int version = raf.readUnsignedShort();
                int options = raf.readUnsignedShort();
                int headerSize = raf.readInt();
                int bodyOffset = 12 + headerSize;
                long bodyLength = f.length() - bodyOffset;
                raf.close();

                System.out.println(String.format("File: %s (size=%d, ver=%d, bodyOffset=%d, bodyLen=%d)",
                    filename, f.length(), version, bodyOffset, bodyLength));

                Ver2DictDecoder decoder = new Ver2DictDecoder(f, bodyOffset, bodyLength, DictDecoder.USE_BYTEARRAY);
                decoder.openDictBuffer();

                int beforeCount = wordFreqMap.size();
                traverse(decoder, 0, "");
                int added = wordFreqMap.size() - beforeCount;
                System.out.println("  -> Extracted " + added + " unique words from " + filename + " (total pool now: " + wordFreqMap.size() + ")");
            } catch (Throwable t) {
                System.err.println("Failed " + filename + ": " + t);
            }
        }
        System.out.println("===========================================");
        System.out.println("TOTAL DEDUPLICATED WORDS EXTRACTED FROM ALL BINARY DICTS: " + wordFreqMap.size());
    }
}
