import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract text from PDF using mock implementation
 */
export async function extractTextFromPDF(file: File | Blob): Promise<string> {
  // Mock implementation - in a real app, this would use a PDF processing library
  return "Sample extracted text from PDF. This would contain the actual content of the uploaded document. The text would be processed and analyzed to generate study materials like flashcards, quizzes, and summaries.";
}

/**
 * Upload PDF to mock service
 */
export async function uploadPDFToOpenAI(file: File, sessionId: string): Promise<{
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}> {
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    id: `file_${Date.now()}`,
    object: "file",
    bytes: file.size,
    created_at: Date.now(),
    filename: file.name,
    purpose: "assistants"
  };
}

/**
 * Chunk text for processing
 */
export function chunkText(text: string, maxLength: number = 4000): string[] {
  if (text.length <= maxLength) {
    return [text];
  }
  
  const chunks: string[] = [];
  let currentChunk = '';
  
  const sentences = text.split('. ');
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        // If single sentence is too long, truncate
        chunks.push(sentence.substring(0, maxLength));
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}
