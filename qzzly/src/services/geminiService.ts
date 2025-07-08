import { GoogleGenAI, GenerateContentResponse, Chat, Part } from "@google/genai";
import { Flashcard, QuizQuestion, StudyFile, FileItem } from '../types/session';

// Initialize Gemini AI with the provided API key
const apiKey = 'AIzaSyCxykzmAuWfh4MMe3K8FliQ8uNcvqoWb2c';
const ai = new GoogleGenAI({ apiKey });
const model = 'gemini-2.5-flash-preview-04-17';

const parseJsonResponse = <T,>(jsonString: string): T | null => {
    let cleanJsonString = jsonString.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = cleanJsonString.match(fenceRegex);
    if (match && match[2]) {
        cleanJsonString = match[2].trim();
    }

    try {
        return JSON.parse(cleanJsonString) as T;
    } catch (error) {
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

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: isJson ? { responseMimeType: "application/json" } : {},
        });
        return response;
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to generate content. Please check your API key and try again.');
    }
};

// Helper function to convert FileItem to StudyFile
const convertToStudyFile = (fileItem: FileItem): StudyFile => {
    return {
        id: fileItem.id,
        name: fileItem.name,
        type: fileItem.type,
        content: fileItem.content || '',
    };
};

export const generateSummary = async (files: FileItem[]): Promise<string> => {
    const studyFiles = files.map(convertToStudyFile);
    const prompt = `Provide a concise, easy-to-understand summary of the following document(s). Focus on the key points, main arguments, and conclusions. If there are images, describe their relevance to the text.`;
    const response = await generateContentWithFiles(studyFiles, prompt);
    return response.text;
};

export const generateNotes = async (files: FileItem[]): Promise<string> => {
    const studyFiles = files.map(convertToStudyFile);
    const prompt = `Create detailed, well-structured study notes from the following document(s). Use markdown for headings, bullet points, and bold key terms to make the notes easy to read and understand. Analyze any images in the context of the text.`;
    const response = await generateContentWithFiles(studyFiles, prompt);
    return response.text;
};

export const generateOutline = async (files: FileItem[]): Promise<string> => {
    const studyFiles = files.map(convertToStudyFile);
    const prompt = `Generate a hierarchical outline of the following document(s) using markdown. Identify the main sections, sub-sections, and key topics.`;
    const response = await generateContentWithFiles(studyFiles, prompt);
    return response.text;
}

export const generateFlashcards = async (files: FileItem[]): Promise<Flashcard[]> => {
    const studyFiles = files.map(convertToStudyFile);
    const prompt = `Based on the following document(s), generate 15-20 key terms and their definitions for a set of flashcards. The output must be a valid JSON array of objects, where each object has a "term" and a "definition" key. Do not include any text outside of the JSON array.`;
    const response = await generateContentWithFiles(studyFiles, prompt, true);
    const parsed = parseJsonResponse<Flashcard[]>(response.text);
    return parsed || [];
};

export const generateQuiz = async (files: FileItem[]): Promise<QuizQuestion[]> => {
    const studyFiles = files.map(convertToStudyFile);
    const prompt = `Create a multiple-choice quiz with 10 questions based on the following document(s). For each question, provide 4 distinct options and indicate the correct answer. The output must be a valid JSON array of objects. Each object should have a "question" (string), "options" (array of 4 strings), and "answer" (string, the full text of the correct option). Do not include any text outside of the JSON array.`;
    const response = await generateContentWithFiles(studyFiles, prompt, true);
    const parsed = parseJsonResponse<QuizQuestion[]>(response.text);
    return parsed || [];
};

export const generateStudyPlan = async (files: FileItem[]): Promise<string> => {
    const studyFiles = files.map(convertToStudyFile);
    const prompt = `You are an expert academic advisor. Analyze the content of the provided document(s) and create a personalized 7-day study plan to help a student master this material. The plan should be structured using Markdown. For each day, suggest specific topics to focus on and which study methods (e.g., summarizing, creating flashcards, taking a quiz) would be most effective. Be encouraging and clear.`;
    const response = await generateContentWithFiles(studyFiles, prompt);
    return response.text;
};

export const generateConceptMap = async (files: FileItem[]): Promise<string> => {
    const studyFiles = files.map(convertToStudyFile);
    const prompt = `Analyze the key concepts, themes, and their relationships within the provided document(s). Generate a Mermaid.js graph definition script (using 'graph TD' for a top-down chart) to visualize this as a concept map. The output must ONLY be the Mermaid.js script inside a \`\`\`mermaid\`\`\` code block. Do not include any other text or explanation.`;
    const response = await generateContentWithFiles(studyFiles, prompt);
    // Extract content from mermaid code block
    const match = response.text.match(/```mermaid\s*\n([\s\S]+?)\n```/);
    return match ? match[1] : '';
};

export const createChat = (files: FileItem[]): Chat => {
    const studyFiles = files.map(convertToStudyFile);
    let systemInstruction = `You are a helpful study assistant. The user has provided document(s) for context. Your task is to answer the user's questions based *only* on the information contained within these documents. Do not use external knowledge. If the answer is not in the documents, say so. After providing a comprehensive answer, add a "DEEP DIVE" section with 3 thought-provoking follow-up questions formatted as a markdown list.`;

    const textContent = studyFiles
      .filter(f => f.type === 'application/pdf')
      .map(f => `\n\n--- Content from ${f.name} ---\n${f.content}`)
      .join('');
      
    systemInstruction += textContent;
    
    return ai.chats.create({
        model,
        config: { systemInstruction },
    });
}; 