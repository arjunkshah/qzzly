// Gemini API Service
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = "AIzaSyCxykzmAuWfh4MMe3K8FliQ8uNcvqoWb2c";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Rate limiting
let lastRequestTime = 0;
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

// Token estimation (approximate)
const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4); // Rough approximation: 1 token ≈ 4 characters
};

// Rate limiting function
const rateLimit = async (): Promise<void> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
};

export interface GeminiOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Generates content using the Gemini API with rate limiting and error handling
 */
export async function generateWithGemini(
  prompt: string,
  options: GeminiOptions = {}
): Promise<GeminiResponse> {
  try {
    await rateLimit();
    
    console.log("Prompt to Gemini:", prompt.substring(0, 200) + "...");
    
    const {
      model = "gemini-1.5-flash",
      temperature = 0.7,
      maxTokens = 2048,
      topP = 0.9,
      topK = 40
    } = options;

    const modelInstance = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature,
        topP,
        topK,
        maxOutputTokens: maxTokens,
      },
    });

    const result = await modelInstance.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini response received:", text.substring(0, 100) + "...");

    return {
      text,
      usage: {
        promptTokens: estimateTokens(prompt),
        completionTokens: estimateTokens(text),
        totalTokens: estimateTokens(prompt) + estimateTokens(text)
      }
    };
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    
    if (error.message?.includes("quota")) {
      throw new Error("API quota exceeded. Please check your Gemini usage limits.");
    }
    
    if (error.message?.includes("rate limit")) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.");
    }
    
    throw new Error(`Gemini API error: ${error.message || "Unknown error"}`);
  }
}

/**
 * Generate flashcards using Gemini
 */
export async function generateFlashcards(
  content: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  count: number = 5
): Promise<Array<{ question: string; answer: string }>> {
  const difficultyPrompts = {
    easy: "Create simple, basic questions suitable for beginners.",
    medium: "Create moderately challenging questions that test understanding.",
    hard: "Create advanced, complex questions that require deep analysis."
  };

  const prompt = `
Based on the following content, generate ${count} high-quality flashcards with questions and answers.

Content: ${content}

Requirements:
- ${difficultyPrompts[difficulty]}
- Questions should be clear and specific
- Answers should be concise but comprehensive
- Cover different aspects of the content
- Avoid overly simple yes/no questions
- Make questions engaging and educational

Format each flashcard as:
Q: [Question]
A: [Answer]

Generate exactly ${count} flashcards:`;

  try {
            const response = await generateWithGemini(prompt, {
      temperature: 0.7,
      maxTokens: 2048
    });

    // Parse the response to extract flashcards
    const flashcards: Array<{ question: string; answer: string }> = [];
    const lines = response.text.split('\n');
    
    let currentQuestion = '';
    let currentAnswer = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('Q:')) {
        if (currentQuestion && currentAnswer) {
          flashcards.push({
            question: currentQuestion.trim(),
            answer: currentAnswer.trim()
          });
        }
        currentQuestion = trimmedLine.substring(2).trim();
        currentAnswer = '';
      } else if (trimmedLine.startsWith('A:')) {
        currentAnswer = trimmedLine.substring(2).trim();
      } else if (currentAnswer) {
        currentAnswer += ' ' + trimmedLine;
      }
    }
    
    // Add the last flashcard
    if (currentQuestion && currentAnswer) {
      flashcards.push({
        question: currentQuestion.trim(),
        answer: currentAnswer.trim()
      });
    }

    return flashcards.slice(0, count);
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw error;
  }
}

/**
 * Generate quiz using Gemini
 */
export async function generateQuiz(
  content: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' = 'multiple_choice',
  count: number = 5
): Promise<Array<{
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
}>> {
  const difficultyPrompts = {
    easy: "Create simple, basic questions suitable for beginners.",
    medium: "Create moderately challenging questions that test understanding.",
    hard: "Create advanced, complex questions that require deep analysis."
  };

  const typePrompts = {
    multiple_choice: "Create multiple choice questions with 4 options (A, B, C, D).",
    true_false: "Create true/false questions.",
    short_answer: "Create short answer questions that require brief explanations."
  };

  const prompt = `
Based on the following content, generate ${count} high-quality quiz questions.

Content: ${content}

Requirements:
- ${difficultyPrompts[difficulty]}
- ${typePrompts[questionType]}
- Questions should be clear and specific
- For multiple choice: provide exactly 4 options labeled A, B, C, D
- For true/false: provide clear true or false answers
- For short answer: provide concise but complete answers
- Include brief explanations for answers when helpful

Format each question as:
Q: [Question]
${questionType === 'multiple_choice' ? 'A) [Option A]\nB) [Option B]\nC) [Option C]\nD) [Option D]' : ''}
A: [Answer]
E: [Explanation - optional]

Generate exactly ${count} questions:`;

  try {
    const response = await generateWithGemini(prompt, {
      temperature: 0.7,
      maxTokens: 3072
    });

    // Parse the response to extract quiz questions
    const questions: Array<{
      question: string;
      options?: string[];
      answer: string;
      explanation?: string;
    }> = [];
    
    const lines = response.text.split('\n');
    let currentQuestion = '';
    let currentOptions: string[] = [];
    let currentAnswer = '';
    let currentExplanation = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('Q:')) {
        if (currentQuestion && currentAnswer) {
          questions.push({
            question: currentQuestion.trim(),
            options: questionType === 'multiple_choice' ? currentOptions : undefined,
            answer: currentAnswer.trim(),
            explanation: currentExplanation.trim() || undefined
          });
        }
        currentQuestion = trimmedLine.substring(2).trim();
        currentOptions = [];
        currentAnswer = '';
        currentExplanation = '';
      } else if (trimmedLine.match(/^[A-D]\)/)) {
        currentOptions.push(trimmedLine.substring(3).trim());
      } else if (trimmedLine.startsWith('A:')) {
        currentAnswer = trimmedLine.substring(2).trim();
      } else if (trimmedLine.startsWith('E:')) {
        currentExplanation = trimmedLine.substring(2).trim();
      } else if (currentAnswer && !trimmedLine.startsWith('E:')) {
        currentAnswer += ' ' + trimmedLine;
      } else if (currentExplanation && trimmedLine.startsWith('E:')) {
        currentExplanation += ' ' + trimmedLine.substring(2);
      }
    }
    
    // Add the last question
    if (currentQuestion && currentAnswer) {
      questions.push({
        question: currentQuestion.trim(),
        options: questionType === 'multiple_choice' ? currentOptions : undefined,
        answer: currentAnswer.trim(),
        explanation: currentExplanation.trim() || undefined
      });
    }

    return questions.slice(0, count);
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
}

/**
 * Generate study material using Gemini
 */
export async function generateStudyMaterial(
  content: string,
  complexity: 'simple' | 'medium' | 'advanced' = 'medium',
  type: 'summary' | 'notes' | 'outline' = 'summary'
): Promise<string> {
  const complexityPrompts = {
    simple: "Write in simple, easy-to-understand language suitable for beginners.",
    medium: "Write with moderate complexity, suitable for intermediate learners.",
    advanced: "Write with advanced concepts and detailed analysis."
  };

  const typePrompts = {
    summary: "Create a comprehensive summary of the key points and main ideas.",
    notes: "Create detailed study notes with important concepts, definitions, and examples.",
    outline: "Create a structured outline with main topics, subtopics, and key points."
  };

  const prompt = `
Based on the following content, generate ${type} study material.

Content: ${content}

Requirements:
- ${complexityPrompts[complexity]}
- ${typePrompts[type]}
- Organize information clearly and logically
- Include key concepts, definitions, and important points
- Make it easy to study and review
- Use headings and bullet points where appropriate
- Focus on the most important information

Generate comprehensive ${type}:`;

  try {
    const response = await generateWithGemini(prompt, {
      temperature: 0.6,
      maxTokens: 4096
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating study material:", error);
    throw error;
  }
}

/**
 * Generate long-form answer using Gemini
 */
export async function generateLongAnswer(
  question: string,
  context: string = ""
): Promise<string> {
  const prompt = `
${context ? `Context: ${context}\n\n` : ''}Question: ${question}

Please provide a comprehensive, detailed answer to this question. Include:
- Clear explanations
- Relevant examples
- Key concepts and definitions
- Step-by-step reasoning where applicable
- Important points to remember

Answer:`;

  try {
    const response = await generateWithGemini(prompt, {
      temperature: 0.7,
      maxTokens: 4096
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating long answer:", error);
    throw error;
  }
}

/**
 * Generate summary using Gemini
 */
export async function generateSummary(
  content: string,
  maxLength: number = 500
): Promise<string> {
  const prompt = `
Summarize the following content in ${maxLength} words or less:

${content}

Requirements:
- Capture the main ideas and key points
- Maintain accuracy and clarity
- Use concise language
- Focus on the most important information
- Make it easy to understand

Summary:`;

  try {
    const response = await generateWithGemini(prompt, {
      temperature: 0.5,
      maxTokens: 1024
    });

    return response.text;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
}

/**
 * Generate chat response using Gemini
 */
export async function generateChatResponse(
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  context: string = ""
): Promise<string> {
  const historyText = conversationHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  const prompt = `
${context ? `Context: ${context}\n\n` : ''}${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}User: ${message}

You are a helpful AI study assistant. Provide a helpful, educational response that:
- Answers the user's question clearly
- Uses the provided context when relevant
- Maintains a helpful and encouraging tone
- Provides additional insights or suggestions when appropriate
- Stays focused on educational content

Assistant:`;

  try {
    const response = await generateWithGemini(prompt, {
      temperature: 0.7,
      maxTokens: 2048
    });

    return response.text;
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw error;
  }
}