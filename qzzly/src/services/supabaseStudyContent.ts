import { supabase } from '@/lib/supabaseClient';
import { StudyMaterial } from '@/types/session';

const TABLE = 'study_materials';

export async function fetchStudyMaterials(sessionId: string): Promise<StudyMaterial[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('session_id', sessionId)
    .order('createdat', { ascending: false });
  if (error) throw new Error(error.message);
  return data as StudyMaterial[];
}

export async function createStudyMaterial(
  sessionId: string,
  userId: string,
  title: string,
  content: string,
  format: 'notes' | 'outline' | 'summary',
  complexity: string
): Promise<StudyMaterial> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      session_id: sessionId,
      user_id: userId,
      title,
      content,
      format,
      complexity,
      createdat: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as StudyMaterial;
}

export async function updateStudyMaterial(
  id: string,
  updates: Partial<StudyMaterial>
): Promise<StudyMaterial> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as StudyMaterial;
}

export async function deleteStudyMaterial(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
} 