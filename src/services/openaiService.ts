// OpenAI API Service
// import pdfParse from 'pdf-parse';
import { Buffer } from 'buffer';

const OPENAI_API_KEY = "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";

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
let lastRequestTime = 0;

// Token limits for different models
const MODEL_LIMITS = {
  'gpt-4': { maxTokens: 8192, inputLimit: 6000 },
  'gpt-4-turbo': { maxTokens: 128000, inputLimit: 100000 },
  'gpt-3.5-turbo': { maxTokens: 4096, inputLimit: 3000 }
};

// Define a more specific type for file items
interface FileItem {
  id: string;
  name: string;
  type: string;
  content?: string;
}

// Store API contexts for each session
interface SessionContext {
  files: FileItem[];
  filePages?: Record<string, string[]>; // Store PDF pages by file ID
  history: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
  lastUpdated: number;
}

// In-memory context store
const sessionContexts: Record<string, SessionContext> = {};

export interface OpenAIOptions {
  temperature?: number;
  maxTokens?: number;
  sessionFiles?: FileItem[];
  sessionId?: string;
  model?: string;
}

/**
 * Rate limiting helper
 */
async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokenCount(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

/**
 * Chunk large text content to fit within token limits
 */
function chunkText(text: string, maxTokens: number): string[] {
  const maxChars = maxTokens * 4; // Rough conversion
  const chunks: string[] = [];
  
  if (text.length <= maxChars) {
    return [text];
  }
  
  // Split by paragraphs first, then by sentences if needed
  const paragraphs = text.split('\n\n');
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length <= maxChars) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      
      // If single paragraph is too long, split by sentences
      if (paragraph.length > maxChars) {
        const sentences = paragraph.split('. ');
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length <= maxChars) {
            currentChunk += (currentChunk ? '. ' : '') + sentence;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk);
              currentChunk = sentence;
            } else {
              // If single sentence is still too long, truncate
              chunks.push(sentence.substring(0, maxChars));
            }
          }
        }
      } else {
        currentChunk = paragraph;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Extract text from PDF buffer using pdf-parse
 */
// async function extractTextFromPDF(content: Buffer): Promise<string> {
//   try {
//     console.log('Starting PDF text extraction with pdf-parse...');
//     console.log(`Buffer size: ${content.length} bytes`);
//     
//     const data = await pdfParse(content);
//     const text = data.text;
//     
//     if (!text || text.trim().length === 0) {
//       throw new Error('No readable text content found in PDF. The document may be image-based, password-protected, or corrupted.');
//     }
//     
//     console.log(`Successfully extracted ${text.length} characters from PDF`);
//     return text.trim();
//   } catch (error) {
//     console.error("PDF text extraction failed:", error);
//     throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
//   }
// }

/**
 * Extract individual pages from PDF using pdf-parse (simplified)
 */
// async function extractPDFPages(content: Buffer): Promise<string[]> {
//   try {
//     console.log('Starting PDF page extraction with pdf-parse...');
//     
//     const text = await extractTextFromPDF(content);
//     
//     // Since pdf-parse doesn't provide page-by-page extraction,
//     // we'll split the text into logical chunks
//     const chunks = text.split('\n\n').filter(chunk => chunk.trim().length > 0);
//     
//     // Group chunks into "pages" of roughly equal size
//     const pages: string[] = [];
//     const targetCharsPerPage = Math.max(500, Math.floor(text.length / 10)); // Aim for ~10 pages max
//     
//     let currentPage = '';
//     for (const chunk of chunks) {
//       if ((currentPage + chunk).length <= targetCharsPerPage) {
//         currentPage += (currentPage ? '\n\n' : '') + chunk;
//       } else {
//         if (currentPage) {
//           pages.push(currentPage);
//         }
//         currentPage = chunk;
//       }
//     }
//     
//     if (currentPage) {
//       pages.push(currentPage);
//     }
//     
//     // Limit to 10 "pages"
//     const limitedPages = pages.slice(0, 10);
//     console.log(`Created ${limitedPages.length} logical pages from PDF text`);
//     
//     return limitedPages;
//   } catch (error) {
//     console.error("PDF page extraction failed:", error);
//     throw error;
//   }
// }

/**
 * Initialize or get a session context
 */
export function getSessionContext(sessionId: string): SessionContext {
  if (!sessionContexts[sessionId]) {
    sessionContexts[sessionId] = {
      files: [],
      history: [],
      lastUpdated: Date.now()
    };
  }
  return sessionContexts[sessionId];
}

/**
 * Add a file to the session context
 */
export function addFileToSessionContext(sessionId: string, file: FileItem): void {
  const context = getSessionContext(sessionId);
  
  // Check if file already exists
  const existingIndex = context.files.findIndex(f => f.id === file.id);
  if (existingIndex >= 0) {
    // Update existing file
    context.files[existingIndex] = file;
  } else {
    // Add new file
    context.files.push(file);
  }
  
  // Add a history entry about the file
  const hasContent = file.content ? ' (with content)' : '';
  context.history.push({
    role: 'system',
    content: `File uploaded: "${file.name}" (${file.type})${hasContent}. Content is available for reference.`
  });
  
  context.lastUpdated = Date.now();
  
  console.log(`Added file ${file.name} to session ${sessionId} context. Total files: ${context.files.length}`);
}

/**
 * Get file content from session context with chunking
 */
function getFileContent(sessionId: string, maxTokens: number = 2000): string {
  const context = getSessionContext(sessionId);
  if (context.files.length === 0) {
    return "";
  }
  
  const allContent = context.files
    .map(file => {
      if (file.content) {
        return `\n\n--- Content from ${file.name} ---\n${file.content}\n--- End of ${file.name} ---`;
      }
      return `\n\n--- File: ${file.name} (${file.type}) - Content not available ---`;
    })
    .join('\n');
  
  // If content is too long, chunk it and return first chunk with summary
  const estimatedTokens = estimateTokenCount(allContent);
  if (estimatedTokens > maxTokens) {
    const chunks = chunkText(allContent, maxTokens);
    const summary = `\n\n[Note: File content is large (${estimatedTokens} tokens). Showing first section. Total ${context.files.length} files available.]`;
    return chunks[0] + summary;
  }
  
  return allContent;
}

/**
 * Generates content using the OpenAI API with rate limiting and error handling
 */
export async function generateWithOpenAI(
  prompt: string,
  options: OpenAIOptions = {}
): Promise<string> {
  console.log("Prompt to OpenAI:", prompt.substring(0, 200) + "...");
  
  try {
    // Enforce rate limiting
    await enforceRateLimit();
    
    // Use GPT-4 by default, fallback to GPT-3.5-turbo if needed
    const model = options.model || 'gpt-4';
    const modelConfig = MODEL_LIMITS[model] || MODEL_LIMITS['gpt-4'];
    
    // Get session context if provided
    let sessionContext: SessionContext | undefined;
    let fileContent = "";
    
    if (options.sessionId) {
      sessionContext = getSessionContext(options.sessionId);
      fileContent = getFileContent(options.sessionId, modelConfig.inputLimit / 2); // Reserve half tokens for file content
    }
    
    // Build messages array
    const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];
    
    // Add system message with file content if available
    if (fileContent) {
      messages.push({
        role: 'system',
        content: `You are a helpful study assistant. You have access to the following uploaded files and their content:${fileContent}\n\nUse this content to provide accurate, relevant responses based on the actual material provided.`
      });
    } else {
      messages.push({
        role: 'system',
        content: 'You are a helpful study assistant. Provide clear, educational responses to help users learn.'
      });
    }
    
    // Add conversation history if using session context (limited to avoid token overflow)
    if (sessionContext && sessionContext.history.length > 0) {
      // Add recent history (last 5 exchanges to avoid token limits)
      const recentHistory = sessionContext.history.slice(-5);
      messages.push(...recentHistory.map(entry => ({
        role: entry.role,
        content: entry.content
      })));
    }
    
    // Add current prompt (truncate if too long)
    const maxPromptTokens = modelConfig.inputLimit - estimateTokenCount(JSON.stringify(messages));
    let finalPrompt = prompt;
    
    if (estimateTokenCount(prompt) > maxPromptTokens) {
      const chunks = chunkText(prompt, maxPromptTokens);
      finalPrompt = chunks[0] + "\n\n[Note: Prompt was truncated due to length]";
    }
    
    messages.push({
      role: 'user',
      content: finalPrompt
    });
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: Math.min(options.maxTokens || 2048, modelConfig.maxTokens)
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: { message: errorText } };
      }
      
      console.error("OpenAI API error:", errorData);
      console.error("Response status:", response.status);
      
      // Handle specific error types
      if (response.status === 401) {
        throw new Error("Authentication failed: API key may be invalid or expired");
      } else if (response.status === 429) {
        const errorMsg = errorData.error?.message || "Rate limit exceeded";
        if (errorMsg.includes("tokens per min")) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again with shorter content.");
        } else if (errorMsg.includes("quota")) {
          throw new Error("API quota exceeded. Please check your OpenAI billing and usage limits.");
        } else {
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
      } else if (response.status === 400 && errorData.error?.message?.includes("maximum context length")) {
        throw new Error("Content too long. Please try with shorter text or fewer files.");
      }
      
      throw new Error(`API Error: ${errorData.error?.message || response.statusText || "Unknown error"}`);
    }
    
    const data = await response.json();
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error("Invalid response format from OpenAI API");
    }
    
    const responseText = data.choices[0].message.content;
    
    // Add to session history if using session context
    if (sessionContext) {
      sessionContext.history.push({
        role: 'user',
        content: finalPrompt
      });
      sessionContext.history.push({
        role: 'assistant',
        content: responseText
      });
      
      // Trim history if it gets too long (keep last 10 entries)
      if (sessionContext.history.length > 10) {
        sessionContext.history = sessionContext.history.slice(-10);
      }
      
      sessionContext.lastUpdated = Date.now();
    }
    
    return responseText;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}

/**
 * Generate flashcards using OpenAI
 */
export async function generateFlashcards(
  material: string, 
  count: number = 5, 
  complexity: string = "medium", 
  files?: FileItem[],
  sessionId?: string
): Promise<Array<{front: string, back: string, mastered: boolean}>> {
  try {
    let difficultyPrompt = "";
    switch(complexity.toLowerCase()) {
      case "easy":
      case "simple":
        difficultyPrompt = "Create simple, basic flashcards suitable for beginners. Use clear, straightforward language.";
        break;
      case "hard":
      case "advanced":
        difficultyPrompt = "Create advanced, challenging flashcards that test deep understanding and complex concepts.";
        break;
      default:
        difficultyPrompt = "Create intermediate-level flashcards that balance clarity with depth.";
    }
    
    // Limit material length to avoid token issues
    const maxMaterialTokens = 2000;
    let processedMaterial = material;
    
    if (estimateTokenCount(material) > maxMaterialTokens) {
      const chunks = chunkText(material, maxMaterialTokens);
      processedMaterial = chunks[0] + "\n\n[Note: Content was truncated due to length]";
    }
    
    const prompt = `${difficultyPrompt}

Generate exactly ${count} flashcards about: ${processedMaterial}

Requirements:
- Each flashcard should have a clear, concise question on the front
- The back should contain a comprehensive but focused answer
- Questions should test understanding, not just memorization
- Vary the types of questions (definitions, explanations, applications, comparisons)
- Make sure answers are accurate and educational

Return the response as a JSON array with this exact format:
[
  {
    "front": "Question text here",
    "back": "Answer text here"
  }
]

Only return the JSON array, no additional text.`;

    const response = await generateWithOpenAI(prompt, {
      sessionId,
      temperature: 0.8,
      maxTokens: 1200,
      model: 'gpt-4'
    });
    
    // Parse the JSON response
    let flashcards;
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse flashcards JSON:", parseError);
      console.error("Raw response:", response);
      
      // Fallback: create flashcards from the response text
      const lines = response.split('\n').filter(line => line.trim());
      flashcards = [];
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        flashcards.push({
          front: `Question ${i + 1} about ${material.substring(0, 50)}...`,
          back: lines[i] || "Study this topic further for better understanding."
        });
      }
    }
    
    // Ensure we have the right number of flashcards and add mastered property
    const result = flashcards.slice(0, count).map((card: { front?: string; question?: string; back?: string; answer?: string }) => ({
      front: card.front || card.question || "Study question",
      back: card.back || card.answer || "Study this topic further",
      mastered: false
    }));
    
    // Fill in missing flashcards if needed
    while (result.length < count) {
      result.push({
        front: `Additional question about ${material.substring(0, 30)}...`,
        back: "Continue studying this topic for better understanding.",
        mastered: false
      });
    }
    
    return result;
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw error;
  }
}

/**
 * Generate quiz using OpenAI
 */
export async function generateQuiz(
  material: string, 
  questionCount: number = 5, 
  difficulty: string = "medium",
  topic: string = "", 
  includeExplanations: boolean = true,
  questionTypes: string[] = ["multiple-choice"],
  files?: FileItem[],
  sessionId?: string
): Promise<{ title: string; questions: { text: string; options: string[]; correctAnswer: number; explanation: string; }[] }> {
  try {
    let difficultyPrompt = "";
    switch(difficulty.toLowerCase()) {
      case "easy":
        difficultyPrompt = "Create easy questions suitable for beginners. Focus on basic concepts and definitions.";
        break;
      case "hard":
        difficultyPrompt = "Create challenging questions that test deep understanding and critical thinking.";
        break;
      default:
        difficultyPrompt = "Create intermediate-level questions that test good understanding of the material.";
    }
    
    const questionTypePrompt = questionTypes.includes("multiple-choice") 
      ? "All questions should be multiple choice with 4 options each."
      : "Create a mix of question types as appropriate.";
    
    const explanationPrompt = includeExplanations 
      ? "Include detailed explanations for each correct answer."
      : "No explanations needed.";
    
    const topicText = topic ? `about ${topic}` : `about: ${material}`;
    
    // Limit material length to avoid token issues
    const maxMaterialTokens = 2000;
    let processedMaterial = material;
    
    if (estimateTokenCount(material) > maxMaterialTokens) {
      const chunks = chunkText(material, maxMaterialTokens);
      processedMaterial = chunks[0] + "\n\n[Note: Content was truncated due to length]";
    }
    
    const prompt = `${difficultyPrompt}

Generate exactly ${questionCount} quiz questions ${topicText}.
Material: ${processedMaterial}

Requirements:
- ${questionTypePrompt}
- ${explanationPrompt}
- Questions should be clear and unambiguous
- Ensure only one correct answer per question
- Make incorrect options plausible but clearly wrong
- Test understanding, not just memorization

Return the response as a JSON object with this exact format:
{
  "title": "Quiz Title Here",
  "questions": [
    {
      "text": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation of why this answer is correct"
    }
  ]
}

Only return the JSON object, no additional text.`;

    const response = await generateWithOpenAI(prompt, {
      sessionId,
      temperature: 0.7,
      maxTokens: 1500,
      model: 'gpt-4'
    });
    
    // Parse the JSON response
    let quiz;
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        quiz = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON object found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse quiz JSON:", parseError);
      console.error("Raw response:", response);
      
      // Fallback quiz
      quiz = {
        title: `Quiz about ${topic || material.substring(0, 30)}...`,
        questions: [
          {
            text: "What is the main topic of this study material?",
            options: [material.substring(0, 20) + "...", "Something else", "Not sure", "Unknown"],
            correctAnswer: 0,
            explanation: "This question is based on the study material provided."
          }
        ]
      };
    }
    
    // Ensure we have the right structure
    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      quiz.questions = [];
    }
    
    // Fill in missing questions if needed
    while (quiz.questions.length < questionCount) {
      quiz.questions.push({
        text: `Question ${quiz.questions.length + 1} about ${topic || material.substring(0, 30)}...`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: 0,
        explanation: "Study this topic further for better understanding."
      });
    }
    
    // Limit to requested number of questions
    quiz.questions = quiz.questions.slice(0, questionCount);
    
    return quiz;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
}

/**
 * Generate study material using OpenAI
 */
export async function generateStudyMaterial(
  topic: string,
  format: 'notes' | 'outline' | 'summary' = 'notes',
  complexity: string = "medium",
  files?: FileItem[],
  sessionId?: string
): Promise<string> {
  try {
    let formatPrompt = "";
    switch(format) {
      case "outline":
        formatPrompt = "Create a detailed outline with main points and sub-points.";
        break;
      case "summary":
        formatPrompt = "Create a comprehensive summary that covers all key points.";
        break;
      default:
        formatPrompt = "Create detailed study notes with explanations and examples.";
    }
    
    let complexityPrompt = "";
    switch(complexity.toLowerCase()) {
      case "simple":
        complexityPrompt = "Use simple language suitable for beginners.";
        break;
      case "advanced":
        complexityPrompt = "Include advanced concepts and detailed analysis.";
        break;
      default:
        complexityPrompt = "Use intermediate-level language with good detail.";
    }
    
    // Limit topic length to avoid token issues
    const maxTopicTokens = 1000;
    let processedTopic = topic;
    
    if (estimateTokenCount(topic) > maxTopicTokens) {
      const chunks = chunkText(topic, maxTopicTokens);
      processedTopic = chunks[0] + "\n\n[Note: Topic was truncated due to length]";
    }
    
    const prompt = `${formatPrompt} ${complexityPrompt}

Create study material about: ${processedTopic}

Requirements:
- Be comprehensive and educational
- Include key concepts and important details
- Use clear, organized structure
- Make it suitable for studying and review
- Include examples where helpful

Provide the study material in a well-formatted, readable format.`;

    const response = await generateWithOpenAI(prompt, {
      sessionId,
      temperature: 0.7,
      maxTokens: 1500,
      model: 'gpt-4'
    });
    
    return response;
  } catch (error) {
    console.error("Error generating study material:", error);
    throw error;
  }
}

/**
 * Generate long-form answer using OpenAI
 */
export async function generateLongAnswer(
  question: string,
  complexity: string = "medium",
  files?: FileItem[],
  sessionId?: string
): Promise<string> {
  try {
    let complexityPrompt = "";
    switch(complexity.toLowerCase()) {
      case "simple":
        complexityPrompt = "Provide a clear, simple explanation suitable for beginners.";
        break;
      case "advanced":
        complexityPrompt = "Provide a detailed, comprehensive analysis with advanced insights.";
        break;
      default:
        complexityPrompt = "Provide a thorough explanation with good detail and examples.";
    }
    
    // Limit question length to avoid token issues
    const maxQuestionTokens = 1000;
    let processedQuestion = question;
    
    if (estimateTokenCount(question) > maxQuestionTokens) {
      const chunks = chunkText(question, maxQuestionTokens);
      processedQuestion = chunks[0] + "\n\n[Note: Question was truncated due to length]";
    }
    
    const prompt = `${complexityPrompt}

Question: ${processedQuestion}

Requirements:
- Provide a comprehensive, well-structured answer
- Include relevant examples and explanations
- Use clear, educational language
- Address all aspects of the question
- Make the response helpful for learning

Please provide a detailed response:`;

    const response = await generateWithOpenAI(prompt, {
      sessionId,
      temperature: 0.7,
      maxTokens: 1200,
      model: 'gpt-4'
    });
    
    return response;
  } catch (error) {
    console.error("Error generating long answer:", error);
    throw error;
  }
}

/**
 * Ingest and summarize file content
 */
export async function ingestAndSummarizeFile(
  file: FileItem,
  sessionId: string
): Promise<{summary: string; topics: string[]}> {
  try {
    if (!file.content) {
      return {
        summary: `File ${file.name} was uploaded but content is not available for analysis.`,
        topics: [file.name.replace(/\.[^/.]+$/, "")]
      };
    }

    const contentForSummary = file.content.length > 4000 
      ? chunkText(file.content, 4000)[0] + "..."
      : file.content;

    const prompt = `Please provide a concise summary and extract up to 5 main topics from the following document content.

Document: ${file.name}
Content: ${contentForSummary}

Return the response as a JSON object with this exact format:
{
  "summary": "A concise summary of the document.",
  "topics": ["Topic 1", "Topic 2", "Topic 3"]
}

Only return the JSON object, no additional text.`;

    const response = await generateWithOpenAI(prompt, {
      sessionId,
      temperature: 0.3,
      maxTokens: 400,
      model: 'gpt-4'
    });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || "Summary could not be generated.",
          topics: parsed.topics || [file.name.replace(/\.[^/.]+$/, "")]
        };
      }
      throw new Error("No JSON object found in response");
    } catch (e) {
      return {
        summary: "Failed to parse summary from AI response.",
        topics: [file.name.replace(/\.[^/.]+$/, "")]
      };
    }
    
  } catch (error) {
    console.error("Error ingesting file:", error);
    return {
      summary: `Error analyzing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      topics: [file.name.replace(/\.[^/.]+$/, "")]
    };
  }
}

/**
 * Ingest all session files
 */
export async function ingestSessionFiles(
  sessionId: string
): Promise<Record<string, {summary: string; topics: string[]}> | null> {
  try {
    const context = getSessionContext(sessionId);
    if (context.files.length === 0) {
      return null;
    }
    
    const results: Record<string, {summary: string; topics: string[]}> = {};
    
    for (const file of context.files) {
      const result = await ingestAndSummarizeFile(file, sessionId);
      results[file.id] = result;
    }
    
    return results;
  } catch (error) {
    console.error("Error ingesting session files:", error);
    return null;
  }
} 