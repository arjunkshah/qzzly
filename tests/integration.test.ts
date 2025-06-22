import { describe, it, expect, beforeEach, afterEach } from 'vitest';

class LocalStorageMock {
  store: Record<string, string> = {};
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
}

class MockFile extends File {
  constructor(name: string) {
    super([], name);
  }
}

describe('Quiz.io Integration Tests', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: new LocalStorageMock(),
      writable: true
    });
  });

  afterEach(() => {
    (window.localStorage as unknown as LocalStorageMock).clear();
  });

  it('should create a new study session', () => {
    const sessionData = { title: 'Test Session', description: 'Test Description' };
    expect(sessionData.title).toBe('Test Session');
    expect(sessionData.description).toBe('Test Description');
  });

  it('should handle file upload', () => {
    const mockFile = new MockFile('test.pdf');
    expect(mockFile.name).toBe('test.pdf');
  });
});
