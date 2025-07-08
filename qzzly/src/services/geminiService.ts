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
    const prompt = `Using ONLY the content from the following files, provide a concise, easy-to-understand summary. Do not use any information that is not present in the files. If the files do not contain enough information, say so.`;
    const response = await generateContentWithFiles(files, prompt);
    return response.text;
};

export const generateNotes = async (files: StudyFile[]): Promise<string> => {
    const prompt = `Using ONLY the content from the following files, create detailed, well-structured study notes. Do not use any information that is not present in the files. If the files do not contain enough information, say so.`;
    const response = await generateContentWithFiles(files, prompt);
    return response.text;
};

export const generateOutline = async (files: StudyFile[]): Promise<string> => {
    const prompt = `Using ONLY the content from the following files, generate a hierarchical outline. Do not use any information that is not present in the files. If the files do not contain enough information, say so.`;
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
  let prompt = `Using ONLY the content from the following files, generate ${count} key terms and their definitions for a set of flashcards. Do not use any information that is not present in the files.`;
  if (topic && topic.trim()) {
    prompt += ` Focus on the topic: ${topic}. If the topic is not covered in the files, say so.`;
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
  let prompt = `Using ONLY the content from the following files, create a multiple-choice quiz with ${count} questions. Do not use any information that is not present in the files.`;
  if (topic && topic.trim()) {
    prompt += ` Focus on the topic: ${topic}. If the topic is not covered in the files, say so.`;
  }
  prompt += ` The quiz should be at a ${difficulty} difficulty level. For each question, provide 4 distinct options and indicate the correct answer. The output must be a valid JSON array of objects. Each object should have a "question" (string), "options" (array of 4 strings), and "answer" (string, the full text of the correct option). Do not include any text outside of the JSON array.`;
  const response = await generateContentWithFiles(files, prompt, true);
    const parsed = parseJsonResponse<QuizQuestion[]>(response.text);
    return parsed || [];
};

export const generateStudyPlan = async (files: StudyFile[]): Promise<string> => {
    const prompt = `Using ONLY the content from the following files, create a personalized 7-day study plan. Do not use any information that is not present in the files. If the files do not contain enough information, say so.`;
    const response = await generateContentWithFiles(files, prompt);
    return response.text;
};

export const generateConceptMap = async (files: StudyFile[]): Promise<string> => {
    const prompt = `Using ONLY the content from the following files, analyze the key concepts, themes, and their relationships. Generate a Mermaid.js graph definition script (using 'graph TD' for a top-down chart) to visualize this as a concept map. Do not use any information that is not present in the files. If the files do not contain enough information, say so. The output must ONLY be the Mermaid.js script inside a \`\`\`mermaid\`\`\` code block. Do not include any other text or explanation.`;
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
  const prompt = `Using ONLY the content from the following files, answer the following question in a detailed, well-explained manner at a ${complexity} complexity level. Do not use any information that is not present in the files. If the answer is not present in the files, say so.\n\nQuestion: ${question}`;
  const response = await generateContentWithFiles(files, prompt);
  return response.text;
};

export const createChat = (files: StudyFile[]): any => {
  // Prepare a context string from all files, limit to 10,000 characters
  let context = files
    .map(f => `--- Content from ${f.name} (${f.type}) ---\n${(f.content || '').slice(0, 2000)}`)
    .join('\n\n');
  if (context.length > 10000) context = context.slice(0, 10000) + '\n...';

  // Return a chat object with a sendMessage method that always includes the context
  return {
    async sendMessage(userMessage: string) {
      try {
        const prompt = `Context:\n${context}\n\nUser: ${userMessage}\n\nAssistant:`;
        const response = await ai.models.generateContent({
        model,
          contents: [{ text: prompt }],
    });
        return { text: response.text };
      } catch (err: any) {
        console.error('Gemini chat error:', err);
        throw new Error(err?.message || 'Gemini chat failed');
      }
    }
  };
}; 