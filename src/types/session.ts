export interface StudySession {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  files: FileItem[];
  flashcards: Flashcard[];
  quizzes: Quiz[];
  studyMaterials?: StudyMaterial[];
}

export interface FileItem {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
  content?: string;
  binaryData?: string; // Base64 encoded file data
  textChunks?: string[]; // Chunked text extracted from PDF for Gemini
  extractedText?: string; // Full extracted text for summary generation
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  content: string;
  format: 'notes' | 'outline' | 'summary';
  complexity: string;
  createdAt: string;
}
