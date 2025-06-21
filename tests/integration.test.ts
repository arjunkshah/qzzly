import { describe, it, expect, beforeEach } from 'vitest';
import { createSession, addFileToSession, addFlashcards, addQuiz, getSessionById } from '../src/services/sessionService';

declare const global: any;

// Simple in-memory localStorage implementation
class LocalStorageMock {
  store: Record<string, string> = {};
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
}

beforeEach(() => {
  global.localStorage = new LocalStorageMock();
});

describe('basic user flow', () => {
  it('creates a session, adds file, flashcards and quiz', async () => {
    const session = await createSession({ title: 'Test Session' });

    const file = { id: 'file1', name: 'test.pdf', type: 'application/pdf', url: '#', uploadedAt: new Date().toISOString() } as any;
    await addFileToSession(session.id, file);

    await addFlashcards(session.id, [
      { front: 'Q1', back: 'A1' },
      { front: 'Q2', back: 'A2' }
    ]);

    await addQuiz(session.id, {
      title: 'Quiz',
      questions: [{ id: 'q1', text: 'T?', options: ['a'], correctAnswer: 0, explanation: 'e' }]
    } as any);

    const updated = await getSessionById(session.id);
    expect(updated?.files.length).toBe(1);
    expect(updated?.flashcards.length).toBeGreaterThanOrEqual(2);
    expect(updated?.quizzes.length).toBe(1);
  });
});
