
export enum StudyMode {
  SUMMARY = 'Summary',
  NOTES = 'Notes',
  OUTLINE = 'Outline',
  FLASHCARDS = 'Flashcards',
  QUIZ = 'Quiz',
  CHAT = 'Chat',
  STUDY_PLAN = 'Study Plan',
  CONCEPT_MAP = 'Concept Map',
}

export interface Flashcard {
  term: string;
  definition: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export type FileType = 'application/pdf' | 'image/png' | 'image/jpeg';

export interface StudyFile {
  id: string;
  name: string;
  type: FileType;
  content: string; // Text for PDF, base64 for images
}

export interface Session {
  id: string;
  name: string;
  files: StudyFile[];
  createdAt: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  suggestedQuestions?: string[];
}