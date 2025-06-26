import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Enhanced PDF text extraction with comprehensive validation
 */
export async function extractTextFromPDF(file: File | Blob): Promise<string> {
  try {
    // Set up the worker with correct path
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
    
    // Convert file to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document with enhanced options
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    }).promise;
    
    console.log(`PDF loaded successfully. Pages: ${pdf.numPages}, File size: ${(file.size / 1024).toFixed(1)}KB`);
    
  let fullText = '';
    let extractedPages = 0;
    let totalTextLength = 0;
    
    // Extract text from each page with enhanced error handling
  for (let i = 1; i <= pdf.numPages; i++) {
      try {
    const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        type TextItem = {
          str: string;
          transform?: number[];
          width?: number;
          height?: number;
        };

        // Enhanced text extraction with better filtering
        const pageText = textContent.items
          .filter((item): item is TextItem => {
            // Filter out empty strings and very short fragments
            return typeof item.str === 'string' && 
                   item.str.trim().length > 0;
          })
          .map((item: TextItem) => item.str.trim())
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n\n';
          extractedPages++;
          totalTextLength += pageText.length;
        }
        
        console.log(`Page ${i}: extracted ${pageText.length} characters`);
      } catch (pageError) {
        console.warn(`Error extracting text from page ${i}:`, pageError);
        // Continue with next page instead of failing completely
        continue;
      }
    }
    
    // Enhanced text cleaning and validation
    const cleanedText = fullText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove excessive line breaks
      .trim();
    
    console.log(`Final extraction: ${cleanedText.length} characters from ${extractedPages}/${pdf.numPages} pages`);
    console.log(`Average text per page: ${extractedPages > 0 ? Math.round(totalTextLength / extractedPages) : 0} characters`);
    
    // Comprehensive validation and fallback messages
    if (cleanedText.length === 0) {
      return `This PDF appears to contain no extractable text. File: ${file instanceof File ? file.name : 'Unknown'} (${(file.size / 1024).toFixed(1)}KB). This might be an image-based PDF, scanned document, or contain only visual elements. Consider using OCR software for image-based PDFs.`;
    }
    
    if (cleanedText.length < 100) {
      return `Limited text extracted from ${file instanceof File ? file.name : 'Unknown'}: "${cleanedText}". This PDF may contain mostly images, charts, or non-text content. File size: ${(file.size / 1024).toFixed(1)}KB. Extracted from ${extractedPages} pages.`;
    }
    
    if (extractedPages < pdf.numPages * 0.5) {
      console.warn(`Warning: Only extracted text from ${extractedPages}/${pdf.numPages} pages. Some pages may be image-based.`);
    }
    
    return cleanedText;
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    return `Failed to extract text from ${file instanceof File ? file.name : 'Unknown'}. Error: ${error instanceof Error ? error.message : 'Unknown error'}. File size: ${(file.size / 1024).toFixed(1)}KB. This may be an encrypted, corrupted, or unsupported PDF format.`;
  }
}

/**
 * Validate PDF text extraction with different document types
 */
export async function validatePDFExtraction(file: File): Promise<{
  success: boolean;
  textLength: number;
  pagesExtracted: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
  sample: string;
}> {
  const issues: string[] = [];
  let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
  
  try {
    const extractedText = await extractTextFromPDF(file);
    const textLength = extractedText.length;
    
    // Count pages by looking for page indicators
    const pageMatches = extractedText.match(/\b(page|p\.)\s*\d+/gi);
    const estimatedPages = pageMatches ? pageMatches.length : Math.ceil(textLength / 2000);
    
    // Quality assessment
    if (textLength === 0) {
      quality = 'poor';
      issues.push('No text extracted - likely image-based PDF');
    } else if (textLength < 200) {
      quality = 'poor';
      issues.push('Very little text extracted');
    } else if (textLength < 1000) {
      quality = 'fair';
      issues.push('Limited text content');
    } else if (textLength < 5000) {
      quality = 'good';
    } else {
      quality = 'excellent';
    }
    
    // Check for common extraction issues
    if (extractedText.includes('Unable to extract') || extractedText.includes('Failed to extract')) {
      quality = 'poor';
      issues.push('Extraction errors detected');
  }
    
    if (extractedText.match(/[^\w\s.,!?;:()[\]{}"'\-–—…]/g)) {
      issues.push('Contains special characters that may indicate formatting issues');
    }
    
    // Check for reasonable text density
    const words = extractedText.split(/\s+/).length;
    const avgWordsPerPage = words / estimatedPages;
    if (avgWordsPerPage < 50) {
      issues.push('Low text density - may be mostly images or charts');
    }
    
    return {
      success: textLength > 0,
      textLength,
      pagesExtracted: estimatedPages,
      quality,
      issues,
      sample: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : '')
    };
  } catch (error) {
    return {
      success: false,
      textLength: 0,
      pagesExtracted: 0,
      quality: 'poor',
      issues: [`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      sample: ''
    };
  }
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
