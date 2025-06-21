import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TextItem } from "pdfjs-dist/types/src/display/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts all text from a PDF file (browser File or Blob)
 * Uses dynamic import for pdfjs-dist for compatibility with Vite/TypeScript
 * @param file PDF File or Blob
 * @returns Promise<string> Full text content
 */
export async function extractTextFromPDF(file: File | Blob): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
  // Set the workerSrc to the local path for browser compatibility
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    const pageText = content.items
      .filter((item): item is TextItem => 'str' in item)
      .map((item) => item.str)
      .join(' ');
    fullText += `\n\n--- Page ${i} ---\n` + pageText;
  }
  return fullText;
}

/**
 * Splits a long string into chunks of a specified max length (in characters).
 * Tries to break at sentence or paragraph boundaries if possible.
 * @param text The full text to split
 * @param maxLength Maximum length of each chunk (default: 4000 chars)
 * @returns string[] Array of text chunks
 */
export function chunkText(text: string, maxLength: number = 4000): string[] {
  const chunks: string[] = [];
  let current = '';
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength) {
      if (current) chunks.push(current);
      current = sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
