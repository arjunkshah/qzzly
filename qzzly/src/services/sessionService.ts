import { supabase } from '@/lib/supabase'
import { Session, FileItem, StudyContent } from '@/lib/supabase'

export interface CreateSessionData {
  title: string
  description?: string
}

export interface UpdateSessionData {
  title?: string
  description?: string
}

export class SessionService {
  static guestSessions: any[] = [];
  static guestSessionId = 1;
  static guestFiles: Record<string, any[]> = {};
  static guestStudyContent: Record<string, any> = {};
  static guestFlashcards: Record<string, any[]> = {};
  static _currentUser: any = null;

  static setCurrentUser(user: any) {
    this._currentUser = user;
  }

  static async getCurrentUser() {
    if (this._currentUser) return this._currentUser;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
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

  static async getSession(sessionId: string): Promise<{ session: any | null; error: string | null }> {
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

  static async addFile(sessionId: string, file: Omit<any, 'id' | 'session_id' | 'created_at'>): Promise<{ file: any | null; error: string | null }> {
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

  static async getFiles(sessionId: string): Promise<{ files: any[] | null; error: string | null }> {
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

  static async saveStudyContent(sessionId: string, type: any, content: string): Promise<{ studyContent: any | null; error: string | null }> {
    const user = await this.getCurrentUser();
    if (user && user.id === 'guest') {
      if (!this.guestStudyContent[sessionId]) this.guestStudyContent[sessionId] = {};
      this.guestStudyContent[sessionId][type] = { session_id: sessionId, type, content };
      return { studyContent: this.guestStudyContent[sessionId][type], error: null };
    }
    try {
      const { data: studyContent, error } = await supabase
        .from('study_content')
        .upsert({
          session_id: sessionId,
          type,
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

  static async getStudyContent(sessionId: string, type: any): Promise<{ studyContent: any | null; error: string | null }> {
    const user = await this.getCurrentUser();
    if (user && user.id === 'guest') {
      return { studyContent: this.guestStudyContent[sessionId]?.[type] || null, error: null };
    }
    try {
      const { data: studyContent, error } = await supabase
        .from('study_content')
        .select('*')
        .eq('session_id', sessionId)
        .eq('type', type)
        .single()

      if (error) {
        return { studyContent: null, error: error.message }
      }

      return { studyContent, error: null }
    } catch (error) {
      return { studyContent: null, error: 'An unexpected error occurred' }
    }
  }

  static async addFlashcards(sessionId: string, flashcards: { front: string; back: string; mastered: boolean }[]): Promise<any[]> {
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

  static async addQuiz(sessionId: string, quiz: { title: string; questions: any[] }): Promise<any> {
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

  static async getQuizzes(sessionId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('session_id', sessionId)
      .order('id', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  static async addChatMessage(sessionId: string, message: { role: string; content: string; timestamp: string }): Promise<any> {
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

  static async getChatMessages(sessionId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('chat')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  static async getFlashcards(sessionId: string): Promise<any[]> {
    // Fetch all flashcard sets for the session
    const { data: sets, error: setError } = await supabase
      .from('flashcard_sets')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (setError) throw new Error(setError.message);
    if (!sets || sets.length === 0) return [];
    // Fetch flashcards for each set
    const setIds = sets.map((s: any) => s.id);
    const { data: flashcards, error: fcError } = await supabase
      .from('flashcards')
      .select('*')
      .in('set_id', setIds);
    if (fcError) throw new Error(fcError.message);
    // Group flashcards by set_id
    const flashcardsBySet: Record<string, any[]> = {};
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
    return sets.map((set: any) => ({
      id: set.id,
      name: set.name,
      createdAt: set.created_at,
      settings: set.settings,
      flashcards: flashcardsBySet[set.id] || [],
    }));
  }
} 