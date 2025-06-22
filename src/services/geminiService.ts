// Gemini API Service
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Flashcard, FileItem } from "@/types/session";

const GEMINI_API_KEY = "AIzaSyCxykzmAuWfh4MMe3K8FliQ8uNcvqoWb2c";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const DEFAULT_MODEL = "models/gemini-pro";

export interface GeminiOptions {
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  topP?: number;
  model?: string;
}

async function callGemini(parts: any[], options: GeminiOptions = {}): Promise<string> {
  const model = genAI.getGenerativeModel({ model: options.model || DEFAULT_MODEL });

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 2048,
      topK: options.topK ?? 40,
      topP: options.topP ?? 0.95,
    },
  });

  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Invalid response from Gemini API");
  }
  return text;
}

export function generateWithGemini(prompt: string, options: GeminiOptions = {}): Promise<string> {
  return callGemini([{ text: prompt }], options);
}

export function generateFileSummary(base64Pdf: string, sessionPrompt = "Summarize this PDF document."): Promise<string> {
  return callGemini([
    { inlineData: { data: base64Pdf, mimeType: "application/pdf" } },
    { text: sessionPrompt },
  ]);
}

export async function generateFlashcards(
  material: string,
  count = 5,
  complexity = "medium",
): Promise<Flashcard[]> {
  const complexityPrompt = complexity === "advanced"
    ? "Create advanced flashcards that require deep understanding."
    : complexity === "simple"
      ? "Create very simple flashcards for beginners."
      : "Create clear flashcards with moderate detail.";

  const prompt = `${complexityPrompt}\n\nGenerate exactly ${count} flashcards as JSON array with 'front' and 'back' fields about: ${material}`;
  const text = await generateWithGemini(prompt, { temperature: 0.4 });

  try {
    const match = text.match(/\[[\s\S]*\]/);
    return (match ? JSON.parse(match[0]) : JSON.parse(text)).map((c: any) => ({
      front: c.front,
      back: c.back,
      mastered: false,
    }));
  } catch {
    throw new Error("Failed to parse flashcards from Gemini response");
  }
}

export async function generateQuiz(
  material: string,
  questionCount = 5,
  difficulty = "medium",
): Promise<{ title: string; questions: { text: string; options: string[]; correctAnswer: number; explanation: string; }[] }> {
  const diffPrompt = difficulty === "advanced"
    ? "Create challenging questions."
    : difficulty === "simple"
      ? "Create easy questions."
      : "Create questions of medium difficulty.";

  const prompt = `${diffPrompt}\n\nGenerate a quiz with ${questionCount} questions as JSON object with 'title' and 'questions' about: ${material}`;
  const text = await generateWithGemini(prompt, { temperature: 0.4 });
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : JSON.parse(text);
  } catch {
    throw new Error("Failed to parse quiz from Gemini response");
  }
}

export function generateStudyMaterial(
  topic: string,
  format: "notes" | "outline" | "summary" = "notes",
  complexity = "medium",
): Promise<string> {
  const formatPrompt =
    format === "outline"
      ? "Create a detailed outline."
      : format === "summary"
        ? "Create a concise summary."
        : "Create detailed study notes.";
  const complexityPrompt =
    complexity === "advanced"
      ? "Use advanced language and include in-depth analysis."
      : complexity === "simple"
        ? "Use simple language suitable for beginners."
        : "Use intermediate-level language.";

  const prompt = `${formatPrompt} ${complexityPrompt}\n\nTopic: ${topic}`;
  return generateWithGemini(prompt, { temperature: 0.5 });
}

export function generateLongAnswer(
  question: string,
  complexity = "medium",
): Promise<string> {
  const complexityPrompt =
    complexity === "advanced"
      ? "Provide a detailed, advanced explanation."
      : complexity === "simple"
        ? "Provide a simple explanation for beginners."
        : "Provide a thorough explanation.";

  const prompt = `${complexityPrompt}\n\nQuestion: ${question}`;
  return generateWithGemini(prompt, { temperature: 0.5 });
}
