export enum StudyMode {
  SUMMARY = 'summary',
  NOTES = 'notes',
  OUTLINE = 'outline',
  FLASHCARDS = 'flashcards',
  QUIZ = 'quiz',
  CHAT = 'chat',
  STUDY_PLAN = 'study_plan',
  CONCEPT_MAP = 'concept_map'
}

export interface FlashcardSet {
  id: string;
  name: string;
  createdAt: string;
  settings: {
    count: number;
    difficulty: string;
    topic: string;
  };
  flashcards: Flashcard[];
}

export interface StudySession {
  id: string;
  title: string;
  description: string;
  createdat: string;
  updatedat: string;
  files: FileItem[];
  flashcardSets: FlashcardSet[];
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
  textChunks?: string[]; // Chunked text extracted from PDF for AI processing
  extractedText?: string; // Full extracted text for summary generation
  summary?: string;
}

// For Gemini service compatibility
export interface StudyFile {
  id: string;
  name: string;
  type: string;
  content: string; // Text for PDF, base64 for images
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

// For Gemini service compatibility
export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
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
  createdat: string;
}
