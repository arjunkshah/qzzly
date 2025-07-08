import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  title: string
  description?: string
  created_at: string
  updated_at: string
}

export interface FileItem {
  id: string
  session_id: string
  name: string
  type: string
  content: string
  created_at: string
}

export interface StudyContent {
  id: string
  session_id: string
  type: 'summary' | 'notes' | 'outline' | 'flashcards' | 'quiz' | 'study_plan' | 'concept_map'
  content: string
  created_at: string
} 