import { StudySession, FileItem, Flashcard, Quiz, ChatMessage } from "@/types/session";
import { apiRequest } from './apiService';
import { canCreateSession, incrementSessionCount, getCurrentUser } from "./authService";

// --- Session Management ---

export const getSessions = (): Promise<StudySession[]> => {
  return apiRequest<StudySession[]>('/api/sessions');
};

export const getSessionById = (id: string): Promise<StudySession | null> => {
  return apiRequest<StudySession | null>(`/api/sessions/${id}`);
};

export const createSession = async (sessionData: Partial<StudySession>): Promise<StudySession> => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('User must be logged in to create sessions');
  }
  if (!canCreateSession(currentUser)) {
    throw new Error('Session limit reached. Upgrade to Pro for unlimited sessions.');
  }
  
  const newSession = await apiRequest<StudySession>('/api/sessions', 'POST', sessionData);
  await incrementSessionCount(currentUser.id);
  
  return newSession;
};

export const deleteSession = (id: string): Promise<void> => {
  return apiRequest<void>(`/api/sessions/${id}`, 'DELETE');
};

export const updateSession = (id: string, updates: Partial<StudySession>): Promise<StudySession> => {
  return apiRequest<StudySession>(`/api/sessions/${id}`, 'PUT', updates);
};

// --- File Management ---

export const addFileToSession = (sessionId: string, file: Omit<FileItem, 'id' | 'url' | 'uploadedAt'>): Promise<StudySession> => {
  return apiRequest<StudySession>(`/api/sessions/${sessionId}/files`, 'POST', file);
};

export const removeFileFromSession = (sessionId: string, fileId: string): Promise<StudySession> => {
  return apiRequest<StudySession>(`/api/sessions/${sessionId}/files/${fileId}`, 'DELETE');
};

// --- Chat Messages ---

export const getChatMessages = (sessionId: string): Promise<ChatMessage[]> => {
  return apiRequest<ChatMessage[]>(`/api/sessions/${sessionId}/messages`);
};

export const addChatMessage = (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> => {
  return apiRequest<ChatMessage>(`/api/sessions/${sessionId}/messages`, 'POST', message);
};

// --- Flashcards ---

export const addFlashcards = (sessionId: string, flashcards: Omit<Flashcard, 'id'>[]): Promise<StudySession> => {
  return apiRequest<StudySession>(`/api/sessions/${sessionId}/flashcards`, 'POST', { flashcards });
};

export const toggleFlashcardMastery = (sessionId: string, flashcardId: string): Promise<Flashcard> => {
  return apiRequest<Flashcard>(`/api/sessions/${sessionId}/flashcards/${flashcardId}/toggle-mastery`, 'PUT');
};

// --- Quizzes ---

export const addQuiz = (sessionId: string, quiz: Omit<Quiz, 'id'>): Promise<StudySession> => {
  return apiRequest<StudySession>(`/api/sessions/${sessionId}/quizzes`, 'POST', { quiz });
}; 