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
  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  static async createSession(data: CreateSessionData): Promise<{ session: Session | null; error: string | null }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { session: null, error: 'User not authenticated' }
      }

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
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { sessions: null, error: 'User not authenticated' }
      }

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

  static async saveStudyContent(sessionId: string, type: StudyContent['type'], content: string): Promise<{ studyContent: StudyContent | null; error: string | null }> {
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

  static async getStudyContent(sessionId: string, type: StudyContent['type']): Promise<{ studyContent: StudyContent | null; error: string | null }> {
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
} 