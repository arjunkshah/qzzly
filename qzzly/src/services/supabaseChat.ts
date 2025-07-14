import { supabase } from '@/lib/supabaseClient';
import { ChatMessage } from '@/types/session';

const TABLE = 'chat_messages';

export async function fetchChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true });
  if (error) throw new Error(error.message);
  return data as ChatMessage[];
}

export async function sendChatMessage(
  sessionId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      session_id: sessionId,
      user_id: userId,
      role,
      content,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ChatMessage;
}

export async function deleteChatMessage(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
} 