import { GoogleGenAI, GenerateContentResponse, Chat, Part } from "@google/genai";
import { Flashcard, QuizQuestion, StudyFile, FileItem } from '../types/session';

// Check if we have a valid API key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const hasValidApiKey = apiKey && apiKey !== 'demo-key' && apiKey.length > 10;

// Initialize Gemini AI only if we have a valid API key
const ai = hasValidApiKey ? new GoogleGenAI({ apiKey }) : null;
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
    // Check if we have a valid API key
    if (!hasValidApiKey || !ai) {
        throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY environment variable.');
    }

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
    try {
        const studyFiles = files.map(convertToStudyFile);
        const prompt = `Provide a concise, easy-to-understand summary of the following document(s). Focus on the key points, main arguments, and conclusions. If there are images, describe their relevance to the text.`;
        const response = await generateContentWithFiles(studyFiles, prompt);
        return response.text;
    } catch (error) {
        console.warn('Using fallback summary generation:', error);
        // Fallback: create a simple summary from file content
        const allContent = files.map(file => file.content).join('\n\n');
        const words = allContent.split(' ').slice(0, 200);
        return `# Summary\n\nThis is a summary of the uploaded documents.\n\n**Content Preview:**\n\n${words.join(' ')}...\n\n*This is a placeholder summary. Set VITE_GEMINI_API_KEY for AI-powered summaries.*`;
    }
};

export const generateNotes = async (files: FileItem[]): Promise<string> => {
    try {
        const studyFiles = files.map(convertToStudyFile);
        const prompt = `Create detailed, well-structured study notes from the following document(s). Use markdown for headings, bullet points, and bold key terms to make the notes easy to read and understand. Analyze any images in the context of the text.`;
        const response = await generateContentWithFiles(studyFiles, prompt);
        return response.text;
    } catch (error) {
        console.warn('Using fallback notes generation:', error);
        const allContent = files.map(file => file.content).join('\n\n');
        const words = allContent.split(' ').slice(0, 300);
        return `# Study Notes\n\n## Key Points\n\n- Document contains ${files.length} file(s)\n- Total content length: ${allContent.length} characters\n\n## Content Overview\n\n${words.join(' ')}...\n\n*This is a placeholder for study notes. Set VITE_GEMINI_API_KEY for AI-powered notes.*`;
    }
};

export const generateOutline = async (files: FileItem[]): Promise<string> => {
    try {
        const studyFiles = files.map(convertToStudyFile);
        const prompt = `Generate a hierarchical outline of the following document(s) using markdown. Identify the main sections, sub-sections, and key topics.`;
        const response = await generateContentWithFiles(studyFiles, prompt);
        return response.text;
    } catch (error) {
        console.warn('Using fallback outline generation:', error);
        return `# Document Outline\n\n## File Structure\n\n${files.map((file, index) => `### ${index + 1}. ${file.name}\n- Type: ${file.type}\n- Content length: ${file.content.length} characters\n`).join('\n')}\n\n*This is a placeholder outline. Set VITE_GEMINI_API_KEY for AI-powered outlines.*`;
    }
}

export const generateFlashcards = async (files: FileItem[]): Promise<Flashcard[]> => {
    try {
        const studyFiles = files.map(convertToStudyFile);
        const prompt = `Based on the following document(s), generate 15-20 key terms and their definitions for a set of flashcards. The output must be a valid JSON array of objects, where each object has a "term" and a "definition" key. Do not include any text outside of the JSON array.`;
        const response = await generateContentWithFiles(studyFiles, prompt, true);
        const parsed = parseJsonResponse<Flashcard[]>(response.text);
        return parsed || [];
    } catch (error) {
        console.warn('Using fallback flashcards generation:', error);
        // Fallback: create sample flashcards
        return [
            { id: '1', front: 'What is the main topic?', back: 'Document analysis and study', mastered: false },
            { id: '2', front: 'How many files were uploaded?', back: `${files.length} file(s)`, mastered: false },
            { id: '3', front: 'What type of content is this?', back: 'Study materials and documents', mastered: false },
        ];
    }
};

export const generateQuiz = async (files: FileItem[]): Promise<QuizQuestion[]> => {
    try {
        const studyFiles = files.map(convertToStudyFile);
        const prompt = `Create a multiple-choice quiz with 10 questions based on the following document(s). For each question, provide 4 distinct options and indicate the correct answer. The output must be a valid JSON array of objects. Each object should have a "question" (string), "options" (array of 4 strings), and "answer" (string, the full text of the correct option). Do not include any text outside of the JSON array.`;
        const response = await generateContentWithFiles(studyFiles, prompt, true);
        const parsed = parseJsonResponse<QuizQuestion[]>(response.text);
        return parsed || [];
    } catch (error) {
        console.warn('Using fallback quiz generation:', error);
        // Fallback: create sample quiz questions
        return [
            {
                question: 'What is the main purpose of this document?',
                options: ['Study material', 'Entertainment', 'Technical manual', 'News article'],
                answer: 'Study material'
            },
            {
                question: 'How many files were uploaded for analysis?',
                options: ['1 file', '2 files', '3 files', `${files.length} files`],
                answer: `${files.length} files`
            },
            {
                question: 'What type of content analysis is being performed?',
                options: ['Text analysis', 'Image processing', 'Audio analysis', 'Video processing'],
                answer: 'Text analysis'
            }
        ];
    }
};

export const generateStudyPlan = async (files: FileItem[]): Promise<string> => {
    try {
        const studyFiles = files.map(convertToStudyFile);
        const prompt = `You are an expert academic advisor. Analyze the content of the provided document(s) and create a personalized 7-day study plan to help a student master this material. The plan should be structured using Markdown. For each day, suggest specific topics to focus on and which study methods (e.g., summarizing, creating flashcards, taking a quiz) would be most effective. Be encouraging and clear.`;
        const response = await generateContentWithFiles(studyFiles, prompt);
        return response.text;
    } catch (error) {
        console.warn('Using fallback study plan generation:', error);
        return `# Your 7-Day Study Plan\n\n## Overview\n\nBased on your ${files.length} uploaded document(s), here's a personalized study plan to help you master the material.\n\n## Day 1: Introduction\n- **Focus**: Overview and key concepts\n- **Activities**: Read through summaries, identify main topics\n- **Time**: 30-45 minutes\n\n## Day 2: Deep Dive\n- **Focus**: Detailed content analysis\n- **Activities**: Create notes, highlight important points\n- **Time**: 45-60 minutes\n\n## Day 3: Practice\n- **Focus**: Application and understanding\n- **Activities**: Take quizzes, test knowledge\n- **Time**: 30-45 minutes\n\n## Day 4: Review\n- **Focus**: Reinforcement and clarification\n- **Activities**: Review flashcards, revisit difficult concepts\n- **Time**: 30 minutes\n\n## Day 5: Application\n- **Focus**: Real-world application\n- **Activities**: Discuss concepts, apply to examples\n- **Time**: 45 minutes\n\n## Day 6: Assessment\n- **Focus**: Self-evaluation\n- **Activities**: Take comprehensive quiz, identify gaps\n- **Time**: 30 minutes\n\n## Day 7: Mastery\n- **Focus**: Final review and confidence building\n- **Activities**: Review all materials, celebrate progress\n- **Time**: 30 minutes\n\n*This is a placeholder study plan. Set VITE_GEMINI_API_KEY for AI-powered personalized plans.*`;
    }
};

export const generateConceptMap = async (files: FileItem[]): Promise<string> => {
    try {
        const studyFiles = files.map(convertToStudyFile);
        const prompt = `Analyze the key concepts, themes, and their relationships within the provided document(s). Generate a Mermaid.js graph definition script (using 'graph TD' for a top-down chart) to visualize this as a concept map. The output must ONLY be the Mermaid.js script inside a \`\`\`mermaid\`\`\` code block. Do not include any other text or explanation.`;
        const response = await generateContentWithFiles(studyFiles, prompt);
        // Extract content from mermaid code block
        const match = response.text.match(/```mermaid\s*\n([\s\S]+?)\n```/);
        return match ? match[1] : '';
    } catch (error) {
        console.warn('Using fallback concept map generation:', error);
        return `graph TD
    A[Document Analysis] --> B[Content Processing]
    A --> C[Study Tools]
    A --> D[Learning Outcomes]
    
    B --> E[Text Extraction]
    B --> F[Content Analysis]
    
    C --> G[Flashcards]
    C --> H[Quizzes]
    C --> I[Notes]
    C --> J[Chat]
    
    D --> K[Understanding]
    D --> L[Retention]
    D --> M[Application]
    
    *This is a placeholder concept map. Set VITE_GEMINI_API_KEY for AI-powered concept maps.*`;
    }
};

export const createChat = (files: FileItem[]): Chat => {
    if (!hasValidApiKey || !ai) {
        throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY environment variable.');
    }

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