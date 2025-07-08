// Frontend-only session service - no API calls
// This service manages sessions using localStorage for demonstration

import { StudySession, FileItem, Flashcard, Quiz } from '@/types/session';

export async function getSessions(): Promise<StudySession[]> {
  const sessions = localStorage.getItem('quiz_io_sessions');
  if (!sessions) return [];
  // Migrate any old sessions to StudySession format
  const parsed = JSON.parse(sessions);
  return parsed.map((s: any) => ({
    id: s.id,
    title: s.title || s.name || 'Untitled Session',
    description: s.description || '',
    createdat: s.createdat || s.createdAt || new Date().toISOString(),
    updatedat: s.updatedat || s.updatedAt || s.createdat || s.createdAt || new Date().toISOString(),
    files: s.files || [],
    flashcards: s.flashcards || [],
    quizzes: s.quizzes || [],
    studyMaterials: s.studyMaterials || [],
  }));
}

export async function createSession(title: string, description = ''): Promise<StudySession> {
  const now = new Date().toISOString();
  const newSession: StudySession = {
    id: `session_${Date.now()}`,
    title: title || 'Untitled Session',
    description,
    createdat: now,
    updatedat: now,
    files: [],
    flashcards: [],
    quizzes: [],
    studyMaterials: [],
  };
  const sessions = await getSessions();
  sessions.push(newSession);
  localStorage.setItem('quiz_io_sessions', JSON.stringify(sessions));
  return newSession;
}

export async function deleteSession(id: string): Promise<void> {
  const sessions = await getSessions();
  const filteredSessions = sessions.filter(s => s.id !== id);
  localStorage.setItem('quiz_io_sessions', JSON.stringify(filteredSessions));
}

export async function getChatMessages(sessionId: string) {
  const messages = localStorage.getItem(`quiz_io_chat_${sessionId}`);
  return messages ? JSON.parse(messages) : [];
}

export async function addChatMessage(sessionId: string, message: any) {
  const messages = await getChatMessages(sessionId);
  messages.push(message);
  localStorage.setItem(`quiz_io_chat_${sessionId}`, JSON.stringify(messages));
}

export async function addFileToSession(sessionId: string, fileUrl: string) {
  const files = localStorage.getItem(`quiz_io_files_${sessionId}`);
  const fileList = files ? JSON.parse(files) : [];
  fileList.push(fileUrl);
  localStorage.setItem(`quiz_io_files_${sessionId}`, JSON.stringify(fileList));
}

export async function addFlashcards(sessionId: string, flashcards: any[]) {
  const existing = localStorage.getItem(`quiz_io_flashcards_${sessionId}`);
  const flashcardList = existing ? JSON.parse(existing) : [];
  flashcardList.push(...flashcards);
  localStorage.setItem(`quiz_io_flashcards_${sessionId}`, JSON.stringify(flashcardList));
}

export async function updateSession(sessionId: string, data: Partial<StudySession>) {
  const sessions = await getSessions();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  if (sessionIndex !== -1) {
    sessions[sessionIndex] = { ...sessions[sessionIndex], ...data };
    localStorage.setItem('quiz_io_sessions', JSON.stringify(sessions));
  }
}

export async function toggleFlashcardMastery(sessionId: string, cardId: string) {
  const flashcards = localStorage.getItem(`quiz_io_flashcards_${sessionId}`);
  const flashcardList = flashcards ? JSON.parse(flashcards) : [];
  const cardIndex = flashcardList.findIndex((card: any) => card.id === cardId);
  if (cardIndex !== -1) {
    flashcardList[cardIndex].mastered = !flashcardList[cardIndex].mastered;
    localStorage.setItem(`quiz_io_flashcards_${sessionId}`, JSON.stringify(flashcardList));
  }
}

export async function addQuiz(sessionId: string, quiz: any) {
  const quizzes = localStorage.getItem(`quiz_io_quizzes_${sessionId}`);
  const quizList = quizzes ? JSON.parse(quizzes) : [];
  quizList.push(quiz);
  localStorage.setItem(`quiz_io_quizzes_${sessionId}`, JSON.stringify(quizList));
}

export async function getSessionById(sessionId: string): Promise<StudySession | null> {
  const sessions = await getSessions();
  return sessions.find(s => s.id === sessionId) || null;
} 