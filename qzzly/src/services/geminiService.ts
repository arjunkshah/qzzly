import { GoogleGenAI, GenerateContentResponse, Chat, Part } from "@google/genai";
import { Flashcard, QuizQuestion, StudyFile } from '../types/session';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });
const model = 'gemini-2.5-flash-preview-04-17';

const parseJsonResponse = <T,>(jsonString: string): T | null => {
    let cleanJsonString = jsonString.trim();
    const fenceRegex = /^```(json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = cleanJsonString.match(fenceRegex);
    if (match && match[2]) {
        cleanJsonString = match[2].trim();
    }

    // Attempt to fix common JSON issues
    // Remove trailing commas
    cleanJsonString = cleanJsonString.replace(/,\s*([}\]])/g, '$1');
    // Remove any text before the first [ or {
    const firstBracket = Math.min(
      ...['[', '{'].map(b => cleanJsonString.indexOf(b)).filter(i => i !== -1)
    );
    if (firstBracket > 0) {
      cleanJsonString = cleanJsonString.slice(firstBracket);
    }
    // Remove any text after the last ] or }
    const lastArray = cleanJsonString.lastIndexOf(']');
    const lastObj = cleanJsonString.lastIndexOf('}');
    const lastBracket = Math.max(lastArray, lastObj);
    if (lastBracket !== -1) {
      cleanJsonString = cleanJsonString.slice(0, lastBracket + 1);
    }

    try {
        return JSON.parse(cleanJsonString) as T;
    } catch (error) {
        // Try to extract the first valid JSON array/object substring
        const arrMatch = cleanJsonString.match(/\[.*\]/s);
        const objMatch = cleanJsonString.match(/\{.*\}/s);
        let fallback = arrMatch ? arrMatch[0] : objMatch ? objMatch[0] : null;
        if (fallback) {
            try {
                return JSON.parse(fallback) as T;
            } catch (e2) {
                console.error("Failed fallback JSON parse:", e2);
            }
        }
        console.error("Failed to parse JSON response:", error);
        console.error("Original string:", jsonString);
        return null;
    }
};

const buildContentParts = (files: StudyFile[]): Part[] => {
    const parts: Part[] = [];
    let combinedText = '';

    files.forEach(file => {
        if (file.type === 'application/pdf') {
            combinedText += `\n\n--- Content from ${file.name} ---\n${file.content}`;
        } else if (file.type.startsWith('image/')) {
            parts.push({
                inlineData: {
                    mimeType: file.type,
                    data: file.content,
                },
            });
        }
    });

    if (combinedText) {
        parts.unshift({ text: combinedText });
    }
    return parts;
};

const generateContentWithFiles = async (files: StudyFile[], userPrompt: string, isJson: boolean = false) => {
    const parts = buildContentParts(files);
    parts.unshift({ text: userPrompt });

    const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: isJson ? { responseMimeType: "application/json" } : {},
    });
    return response;
};

export const generateSummary = async (files: StudyFile[]): Promise<string> => {
    const prompt = `Provide a concise, easy-to-understand summary of the following document(s). Focus on the key points, main arguments, and conclusions. If there are images, describe their relevance to the text.`;
    const response = await generateContentWithFiles(files, prompt);
    return response.text;
};

export const generateNotes = async (files: StudyFile[]): Promise<string> => {
    const prompt = `Create detailed, well-structured study notes from the following document(s). Use markdown for headings, bullet points, and bold key terms to make the notes easy to read and understand. Analyze any images in the context of the text.`;
    const response = await generateContentWithFiles(files, prompt);
    return response.text;
};

export const generateOutline = async (files: StudyFile[]): Promise<string> => {
    const prompt = `Generate a hierarchical outline of the following document(s) using markdown. Identify the main sections, sub-sections, and key topics.`;
    const response = await generateContentWithFiles(files, prompt);
    return response.text;
}

// Add this type for Gemini's raw flashcard output
interface GeminiRawFlashcard {
  term?: string;
  definition?: string;
  front?: string;
  back?: string;
}

export const generateFlashcards = async (
  files: StudyFile[],
  count: number = 15,
  difficulty: string = 'medium',
  topic: string = ''
): Promise<Flashcard[]> => {
  let prompt = `Based on the following document(s), generate ${count} key terms and their definitions for a set of flashcards.`;
  if (topic && topic.trim()) {
    prompt += ` Focus on the topic: ${topic}.`;
  }
  prompt += ` The flashcards should be at a ${difficulty} difficulty level. The output must be a valid JSON array of objects, where each object has a "term" and a "definition" key. Do not include any text outside of the JSON array.`;
  const response = await generateContentWithFiles(files, prompt, true);
  const parsed = parseJsonResponse<GeminiRawFlashcard[]>(response.text);
  // Map Gemini's {term, definition} to Flashcard {id, front, back, mastered}
  return (parsed || []).map((card, idx) => ({
    id: `fc_${Date.now()}_${idx}`,
    front: (card.term || card.front || ''),
    back: (card.definition || card.back || ''),
    mastered: false,
  }));
};

export const generateQuiz = async (
  files: StudyFile[],
  count: number = 10,
  difficulty: string = 'medium',
  topic: string = ''
): Promise<QuizQuestion[]> => {
  let prompt = `Create a multiple-choice quiz with ${count} questions based on the following document(s).`;
  if (topic && topic.trim()) {
    prompt += ` Focus on the topic: ${topic}.`;
  }
  prompt += ` The quiz should be at a ${difficulty} difficulty level. For each question, provide 4 distinct options and indicate the correct answer. The output must be a valid JSON array of objects. Each object should have a "question" (string), "options" (array of 4 strings), and "answer" (string, the full text of the correct option). Do not include any text outside of the JSON array.`;
  const response = await generateContentWithFiles(files, prompt, true);
  const parsed = parseJsonResponse<QuizQuestion[]>(response.text);
  return parsed || [];
};

export const generateStudyPlan = async (files: StudyFile[]): Promise<string> => {
    const prompt = `You are an expert academic advisor. Analyze the content of the provided document(s) and create a personalized 7-day study plan to help a student master this material. The plan should be structured using Markdown. For each day, suggest specific topics to focus on and which study methods (e.g., summarizing, creating flashcards, taking a quiz) would be most effective. Be encouraging and clear.`;
    const response = await generateContentWithFiles(files, prompt);
    return response.text;
};

export const generateConceptMap = async (files: StudyFile[]): Promise<string> => {
    const prompt = `Analyze the key concepts, themes, and their relationships within the provided document(s). Generate a Mermaid.js graph definition script (using 'graph TD' for a top-down chart) to visualize this as a concept map. The output must ONLY be the Mermaid.js script inside a \`\`\`mermaid\`\`\` code block. Do not include any other text or explanation.`;
    const response = await generateContentWithFiles(files, prompt);
    // Extract content from mermaid code block
    const match = response.text.match(/```mermaid\s*\n([\s\S]+?)\n```/);
    return match ? match[1] : '';
};

export const generateLongAnswer = async (
  files: StudyFile[],
  question: string,
  complexity: string = 'medium'
): Promise<string> => {
  const prompt = `Answer the following question in a detailed, well-explained manner at a ${complexity} complexity level, using only the provided documents for context.\n\nQuestion: ${question}`;
  const response = await generateContentWithFiles(files, prompt);
  return response.text;
};

export const createChat = (files: StudyFile[]): Chat => {
    let systemInstruction = `You are a helpful study assistant. The user has provided document(s) for context. Your task is to answer the user's questions based *only* on the information contained within these documents. Do not use external knowledge. If the answer is not in the documents, say so. After providing a comprehensive answer, add a "DEEP DIVE" section with 3 thought-provoking follow-up questions formatted as a markdown list.`;

    const textContent = files
      .filter(f => f.type === 'application/pdf')
      .map(f => `\n\n--- Content from ${f.name} ---\n${f.content}`)
      .join('');
      
    systemInstruction += textContent;
    
    // Note: The base `createChat` doesn't directly support images in system instructions in the same way `generateContent` does. 
    // For chat, we will pass images with each message.
    
    return ai.chats.create({
        model,
        config: { systemInstruction },
    });
}; 