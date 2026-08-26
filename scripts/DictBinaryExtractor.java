
package com.android.inputmethod.latin.makedict;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class DictBinaryExtractor {
    public static void main(String[] args) {
        if (args.length < 2) {
            System.err.println("Usage: DictBinaryExtractor <dict_file> <output_tsv>");
            System.exit(1);
        }
        File dictFile = new File(args[0]);
        File outFile = new File(args[1]);

        try {
            if (!dictFile.exists() || dictFile.length() < 16) {
                System.err.println("File is empty or does not exist: " + dictFile);
                System.exit(0);
            }
            RandomAccessFile raf = new RandomAccessFile(dictFile, "r");
            int magic = raf.readInt();
            if (magic != FormatSpec.MAGIC_NUMBER) {
                System.err.println("Invalid magic number in " + dictFile);
                raf.close();
                System.exit(0);
            }
            int version = raf.readUnsignedShort();
            int options = raf.readUnsignedShort();
            int headerSize = raf.readInt();
            int bodyOffset = 12 + headerSize;
            long bodyLength = dictFile.length() - bodyOffset;
            raf.close();

            if (bodyLength <= 0) {
                System.exit(0);
            }

            Ver2DictDecoder decoder = new Ver2DictDecoder(dictFile, bodyOffset, bodyLength, DictDecoder.USE_BYTEARRAY);
            decoder.openDictBuffer();

            BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(outFile), StandardCharsets.UTF_8), 1024 * 1024);
            Set<Integer> visited = new HashSet<>();
            long[] count = new long[1];
            traverse(decoder, 0, "", bw, count, visited);
            bw.flush();
            bw.close();
            System.out.println("EXTRACTED_ENTRIES=" + count[0]);
        } catch (Throwable t) {
            System.err.println("Error extracting from " + dictFile + ": " + t.getMessage());
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
                    writer.write(currentWord + "\t" + freq + "\n");
                    count[0]++;
                }

                if (BinaryDictIOUtils.hasChildrenAddress(info.mFlags) && info.mChildrenAddress > 0) {
                    traverse(decoder, info.mChildrenAddress, currentWord, writer, count, visited);
                }

                currentPos = info.mEndAddress;
            }
        } catch (Exception e) {
            // End of branch
        }
    }
}
