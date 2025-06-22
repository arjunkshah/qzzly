import { StudySession, FileItem, Flashcard, Quiz, ChatMessage } from "@/types/session";
import { apiRequest } from './apiService';
import { canCreateSession, incrementSessionCount, getCurrentUser } from "./authService";

// --- Session Management ---

export const getSessions = (): Promise<StudySession[]> => {
  return apiRequest<StudySession[]>('/sessions');
};

export const getSessionById = (id: string): Promise<StudySession | null> => {
  return apiRequest<StudySession | null>(`/sessions/${id}`);
};

export const createSession = async (sessionData: Partial<StudySession>): Promise<StudySession> => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('User must be logged in to create sessions');
  }
  if (!canCreateSession(currentUser)) {
    throw new Error('Session limit reached. Upgrade to Pro for unlimited sessions.');
  }
  
  const newSession = await apiRequest<StudySession>('/sessions', 'POST', sessionData);
  await incrementSessionCount(currentUser.id);
  
  return newSession;
};

export const deleteSession = (id: string): Promise<void> => {
  return apiRequest<void>(`/sessions/${id}`, 'DELETE');
};

export const updateSession = (id: string, updates: Partial<StudySession>): Promise<StudySession> => {
  return apiRequest<StudySession>(`/sessions/${id}`, 'PUT', updates);
};

// --- File Management ---

export const addFileToSession = (sessionId: string, file: Omit<FileItem, 'id' | 'url' | 'uploadedAt'>): Promise<StudySession> => {
  return apiRequest<StudySession>(`/sessions/${sessionId}/files`, 'POST', file);
};

export const removeFileFromSession = (sessionId: string, fileId: string): Promise<StudySession> => {
  return apiRequest<StudySession>(`/sessions/${sessionId}/files/${fileId}`, 'DELETE');
};

// --- Chat Messages ---

export const getChatMessages = (sessionId: string): Promise<ChatMessage[]> => {
  return apiRequest<ChatMessage[]>(`/sessions/${sessionId}/messages`);
};

export const addChatMessage = (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> => {
  return apiRequest<ChatMessage>(`/sessions/${sessionId}/messages`, 'POST', message);
};

// --- Flashcards ---

export const addFlashcards = (sessionId: string, flashcards: Omit<Flashcard, 'id'>[]): Promise<StudySession> => {
  return apiRequest<StudySession>(`/sessions/${sessionId}/flashcards`, 'POST', { flashcards });
};

// --- Quizzes ---

export const addQuiz = (sessionId: string, quiz: Omit<Quiz, 'id'>): Promise<StudySession> => {
  return apiRequest<StudySession>(`/sessions/${sessionId}/quizzes`, 'POST', { quiz });
}; 