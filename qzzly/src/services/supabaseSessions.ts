import { supabase } from '@/lib/supabaseClient';
import { StudySession } from '@/types/session';

const TABLE = 'sessions';

export async function fetchSessions(userId: string): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('createdat', { ascending: false });
  if (error) throw new Error(error.message);
  return data as StudySession[];
}

export async function fetchSessionById(id: string): Promise<StudySession | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as StudySession;
}

export async function createSession(userId: string, title: string, description: string): Promise<StudySession> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      title,
      description,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as StudySession;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
} 