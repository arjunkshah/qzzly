import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Production backend URL - will be set by environment variable or ngrok URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Extract text from PDF using the backend olmOCR FastAPI service
 */
export async function extractTextFromPDF(file: File | Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${BACKEND_URL}/extract-pdf-text`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to extract PDF text');
  }
  const data = await response.json();
  return data.text || '';
}

/**
 * Validate PDF extraction using the backend olmOCR FastAPI service
 */
export async function validatePDFExtraction(file: File): Promise<{
  success: boolean;
  textLength: number;
  quality: string;
  issues: string[];
  sample: string;
  filename: string;
}> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${BACKEND_URL}/validate-pdf`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to validate PDF');
  }
  return await response.json();
}

/**
 * Splits a long string into chunks of a specified max length (in characters).
 * Tries to break at sentence or paragraph boundaries if possible.
 * @param text The full text to split
 * @param maxLength Maximum length of each chunk (default: 4000 chars)
 * @returns string[] Array of text chunks
 */
export function chunkText(text: string, maxLength: number = 4000): string[] {
  if (text.length <= maxLength) {
    return [text];
  }
  
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if ((currentChunk + trimmedSentence).length <= maxLength) {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.');
        currentChunk = trimmedSentence;
      } else {
        // If single sentence is too long, split by words
        const words = trimmedSentence.split(' ');
        let wordChunk = '';
        for (const word of words) {
          if ((wordChunk + word).length <= maxLength) {
            wordChunk += (wordChunk ? ' ' : '') + word;
          } else {
            if (wordChunk) {
              chunks.push(wordChunk);
              wordChunk = word;
            } else {
              // If single word is too long, truncate
              chunks.push(word.substring(0, maxLength));
            }
          }
        }
        if (wordChunk) {
          currentChunk = wordChunk;
    }
  }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk + (currentChunk.endsWith('.') ? '' : '.'));
  }
  
  return chunks;
}
