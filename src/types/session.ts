
export interface StudySession {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  files: FileItem[];
  flashcards: Flashcard[];
  quizzes: Quiz[];
}

export interface FileItem {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
  content?: string;
  summary?: string;
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
