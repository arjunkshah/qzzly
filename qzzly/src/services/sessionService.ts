import { supabase } from '@/lib/supabase'
import { Session, FileItem, StudyContent } from '@/lib/supabase'
import { Flashcard, Quiz, ChatMessage, FlashcardSet } from '@/types/session'
import type { User as SupabaseUser } from '@supabase/auth-js'

export interface CreateSessionData {
  title: string
  description?: string
}

export interface UpdateSessionData {
  title?: string
  description?: string
}

export class SessionService {
  static guestSessions: Session[] = [];
  static guestSessionId = 1;
  static guestFiles: Record<string, FileItem[]> = {};
  static guestStudyContent: Record<string, Record<string, StudyContent>> = {};
  static guestFlashcards: Record<string, Flashcard[]> = {};
  static _currentUser: SupabaseUser | null = null;

  static setCurrentUser(user: SupabaseUser | null) {
    this._currentUser = user;
  }

  static async getCurrentUser(): Promise<SupabaseUser | null> {
    if (this._currentUser) return this._currentUser;
    const { data: { user } } = await supabase.auth.getUser();
    return user || null;
  }

  static async createSession(data: CreateSessionData): Promise<{ session: Session | null; error: string | null }> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { session: null, error: 'User not authenticated' };
    }
    if (user.id === 'guest') {
      const session = {
        id: `guest-session-${this.guestSessionId++}`,
        user_id: 'guest',
        title: data.title,
        description: data.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.guestSessions.unshift(session);
      return { session, error: null };
}
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description,
        })
        .select()
        .single()

      if (error) {
        return { session: null, error: error.message }
      }

      return { session, error: null }
    } catch (error) {
      return { session: null, error: 'An unexpected error occurred' }
    }
  }

  static async getSessions(): Promise<{ sessions: Session[] | null; error: string | null }> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { sessions: null, error: 'User not authenticated' };
    }
    if (user.id === 'guest') {
      return { sessions: this.guestSessions, error: null };
    }
    try {
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return { sessions: null, error: error.message }
      }

      return { sessions, error: null }
    } catch (error) {
      return { sessions: null, error: 'An unexpected error occurred' }
    }
  }

  static async getSession(sessionId: string): Promise<{ session: Session | null; error: string | null }> {
    const user = await this.getCurrentUser();
    if (user && user.id === 'guest') {
      const session = this.guestSessions.find(s => s.id === sessionId) || null;
      return { session, error: null };
    }
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) {
        return { session: null, error: error.message }
      }

      return { session, error: null }
    } catch (error) {
      return { session: null, error: 'An unexpected error occurred' }
    }
  }

  static async updateSession(sessionId: string, data: UpdateSessionData): Promise<{ session: Session | null; error: string | null }> {
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .update(data)
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        return { session: null, error: error.message }
      }

      return { session, error: null }
    } catch (error) {
      return { session: null, error: 'An unexpected error occurred' }
    }
  }

  static async deleteSession(sessionId: string): Promise<{ error: string | null }> {
    const user = await this.getCurrentUser();
    if (user && user.id === 'guest') {
      this.guestSessions = this.guestSessions.filter(s => s.id !== sessionId);
      return { error: null };
    }
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  static async addFile(sessionId: string, file: Omit<FileItem, 'id' | 'session_id' | 'created_at'>): Promise<{ file: FileItem | null; error: string | null }> {
    const user = await this.getCurrentUser();
    if (user && user.id === 'guest') {
      if (!this.guestFiles[sessionId]) this.guestFiles[sessionId] = [];
      const newFile = {
        ...file,
        id: `guest-file-${this.guestFiles[sessionId].length + 1}`,
        session_id: sessionId,
        created_at: new Date().toISOString(),
      };
      this.guestFiles[sessionId].push(newFile);
      return { file: newFile, error: null };
    }
    try {
      const { data: fileData, error } = await supabase
        .from('files')
        .insert({
          session_id: sessionId,
          name: file.name,
          type: file.type,
          content: file.content,
        })
        .select()
        .single()

      if (error) {
        return { file: null, error: error.message }
      }

      return { file: fileData, error: null }
    } catch (error) {
      return { file: null, error: 'An unexpected error occurred' }
    }
  }

  static async getFiles(sessionId: string): Promise<{ files: FileItem[] | null; error: string | null }> {
    const user = await this.getCurrentUser();
    if (user && user.id === 'guest') {
      return { files: this.guestFiles[sessionId] || [], error: null };
    }
    try {
      const { data: files, error } = await supabase
        .from('files')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        return { files: null, error: error.message }
      }

      return { files, error: null }
    } catch (error) {
      return { files: null, error: 'An unexpected error occurred' }
    }
  }

  static async saveStudyContent(sessionId: string, contentType: StudyContent['content_type'], content: string): Promise<{ studyContent: StudyContent | null; error: string | null }> {
    const user = await this.getCurrentUser();
    if (user && user.id === 'guest') {
      if (!this.guestStudyContent[sessionId]) this.guestStudyContent[sessionId] = {};
      const allowedTypes: StudyContent['content_type'][] = ['summary', 'notes', 'outline', 'flashcards', 'quiz', 'study_plan', 'concept_map'];
      const safeType = (allowedTypes.includes(contentType as StudyContent['content_type']) ? contentType : 'notes') as StudyContent['content_type'];
      this.guestStudyContent[sessionId][contentType] = {
        id: `guest-study-content-${sessionId}-${contentType}`,
        session_id: sessionId,
        content_type: contentType,
        content,
        created_at: new Date().toISOString(),
      };
      return { studyContent: this.guestStudyContent[sessionId][contentType], error: null };
    }
    try {
      const { data: studyContent, error } = await supabase
        .from('study_content')
        .upsert({
          session_id: sessionId,
          content_type: contentType,
          content,
        })
        .select()
        .single()

      if (error) {
        return { studyContent: null, error: error.message }
}

      return { studyContent, error: null }
    } catch (error) {
      return { studyContent: null, error: 'An unexpected error occurred' }
  }
}

  static async getStudyContent(sessionId: string, contentType: StudyContent['content_type']): Promise<{ studyContent: StudyContent | null; error: string | null }> {
    const user = await this.getCurrentUser();
    if (user && user.id === 'guest') {
      return { studyContent: this.guestStudyContent[sessionId]?.[contentType] || null, error: null };
    }
    try {
      const { data: studyContent, error } = await supabase
        .from('study_content')
        .select('*')
        .eq('session_id', sessionId)
        .eq('content_type', contentType)
        .single()

      if (error) {
        return { studyContent: null, error: error.message }
      }

      return { studyContent, error: null }
    } catch (error) {
      return { studyContent: null, error: 'An unexpected error occurred' }
    }
  }

  static async addFlashcards(sessionId: string, flashcards: Omit<Flashcard, 'id' | 'session_id'>[]): Promise<Flashcard[]> {
    const user = await this.getCurrentUser();
    if (user && user.id === 'guest') {
      if (!this.guestFlashcards[sessionId]) this.guestFlashcards[sessionId] = [];
      const newFlashcards = flashcards.map((f, i) => ({
        ...f,
        id: `guest-flashcard-${this.guestFlashcards[sessionId].length + i + 1}`,
        session_id: sessionId,
      }));
      this.guestFlashcards[sessionId].push(...newFlashcards);
      return newFlashcards;
    }
    // Insert multiple flashcards for a session
    const { data, error } = await supabase
      .from('flashcards')
      .insert(flashcards.map(f => ({
        session_id: sessionId,
        front: f.front,
        back: f.back,
        mastered: f.mastered
      })))
      .select();
    if (error) throw new Error(error.message);
    return data;
  }

  static async addQuiz(sessionId: string, quiz: Omit<Quiz, 'id' | 'session_id'>): Promise<Quiz> {
    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        session_id: sessionId,
        title: quiz.title,
        questions: quiz.questions,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async getQuizzes(sessionId: string): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('session_id', sessionId)
      .order('id', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  static async addChatMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'session_id'>): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat')
      .insert({
        session_id: sessionId,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  static async getFlashcards(sessionId: string): Promise<FlashcardSet[]> {
    // Fetch all flashcard sets for the session
    const { data: sets, error: setError } = await supabase
      .from('flashcard_sets')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (setError) throw new Error(setError.message);
    if (!sets || sets.length === 0) return [];
    // Fetch flashcards for each set
    const setIds = sets.map((s: FlashcardSet) => s.id);
    const { data: flashcards, error: fcError } = await supabase
      .from('flashcards')
      .select('*')
      .in('set_id', setIds);
    if (fcError) throw new Error(fcError.message);
    // Group flashcards by set_id
    const flashcardsBySet: Record<string, Flashcard[]> = {};
    for (const fc of flashcards || []) {
      if (!flashcardsBySet[fc.set_id]) flashcardsBySet[fc.set_id] = [];
      flashcardsBySet[fc.set_id].push({
        id: fc.id,
        front: fc.front,
        back: fc.back,
        mastered: fc.mastered,
      });
    }
    // Build FlashcardSet objects
    return sets.map((set: FlashcardSet) => ({
      id: set.id,
      name: set.name,
      createdAt: set.createdAt,
      settings: set.settings,
      flashcards: flashcardsBySet[set.id] || [],
    }));
  }
} 