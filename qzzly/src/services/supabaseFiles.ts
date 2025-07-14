import { supabase } from '@/lib/supabaseClient';
import { FileItem } from '@/types/session';

const TABLE = 'files';
const STORAGE_BUCKET = 'session-files';

export async function fetchFiles(sessionId: string): Promise<FileItem[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('session_id', sessionId)
    .order('uploadedAt', { ascending: false });
  if (error) throw new Error(error.message);
  return data as FileItem[];
}

export async function uploadFile(
  sessionId: string,
  userId: string,
  file: File
): Promise<FileItem> {
  // Upload to Supabase Storage
  const filePath = `${userId}/${sessionId}/${Date.now()}_${file.name}`;
  const { data: storageData, error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file);
  if (storageError) throw new Error(storageError.message);

  const url = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath).data.publicUrl;

  // Insert file metadata into DB
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      session_id: sessionId,
      user_id: userId,
      name: file.name,
      url,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as FileItem;
}

export async function deleteFile(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
} 