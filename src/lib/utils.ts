import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Always use relative /.netlify/functions for Netlify deployment
const BACKEND_URL = '/.netlify/functions';

/**
 * Extract text from PDF using OpenAI API via backend
 */
export async function extractTextFromPDF(file: File | Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', file); // file must be a File or Blob
  const response = await fetch(`${BACKEND_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to upload PDF to OpenAI');
  }
  const data = await response.json();
  // For now, return a placeholder since we need to implement text extraction
  // This will be enhanced when we add the OpenAI Assistants API integration
  return `PDF uploaded successfully with ID: ${data.id}`;
}

/**
 * Upload PDF to OpenAI API via backend
 */
export async function uploadPDFToOpenAI(file: File, sessionId: string): Promise<{
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}> {
  const formData = new FormData();
  formData.append('file', file); // file must be a File or Blob
  formData.append('sessionId', sessionId); // send sessionId as form field
  const response = await fetch(`${BACKEND_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to upload PDF to OpenAI');
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
