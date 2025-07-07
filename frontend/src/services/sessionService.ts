// Stub implementation of sessionService for build purposes.
// Replace with real API calls once backend session endpoints are ready.

export interface Session {
  id: string;
  name?: string;
  createdAt?: string;
}

export async function getSessions(): Promise<Session[]> {
  return [];
}

export async function createSession(name: string): Promise<Session> {
  return { id: Date.now().toString(), name, createdAt: new Date().toISOString() };
}

export async function deleteSession(id: string): Promise<void> {
  return;
}

// Study-related helpers — stubs only -------------------------------------------------
export async function getChatMessages(sessionId: string) {
  return [] as any[];
}

export async function addChatMessage(sessionId: string, message: any) {
  return;
}

export async function addFileToSession(sessionId: string, fileUrl: string) {
  return;
}

export async function addFlashcards(sessionId: string, flashcards: any[]) {
  return;
}

export async function updateSession(sessionId: string, data: Partial<Session>) {
  return;
}

export async function toggleFlashcardMastery(sessionId: string, cardId: string) {
  return;
}

export async function addQuiz(sessionId: string, quiz: any) {
  return;
}

export async function getSessionById(sessionId: string): Promise<Session | null> {
  return null;
} 