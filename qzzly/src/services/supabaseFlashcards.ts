import { supabase } from '@/lib/supabaseClient';
import { FlashcardSet, Flashcard } from '@/types/session';

const SETS_TABLE = 'flashcard_sets';
const CARDS_TABLE = 'flashcards';

export async function fetchFlashcardSets(sessionId: string): Promise<FlashcardSet[]> {
  const { data, error } = await supabase
    .from(SETS_TABLE)
    .select('*, flashcards:flashcards(*)')
    .eq('session_id', sessionId)
    .order('createdAt', { ascending: false });
  if (error) throw new Error(error.message);
  return data as FlashcardSet[];
}

export async function createFlashcardSet(
  sessionId: string,
  userId: string,
  name: string,
  settings: any
): Promise<FlashcardSet> {
  const { data, error } = await supabase
    .from(SETS_TABLE)
    .insert({
      session_id: sessionId,
      user_id: userId,
      name,
      settings,
      createdAt: new Date().toISOString(),
    })
    .select('*, flashcards:flashcards(*)')
    .single();
  if (error) throw new Error(error.message);
  return data as FlashcardSet;
}

export async function deleteFlashcardSet(id: string): Promise<void> {
  const { error } = await supabase
    .from(SETS_TABLE)
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function addFlashcard(
  setId: string,
  front: string,
  back: string
): Promise<Flashcard> {
  const { data, error } = await supabase
    .from(CARDS_TABLE)
    .insert({
      set_id: setId,
      front,
      back,
      mastered: false,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Flashcard;
}

export async function updateFlashcard(
  id: string,
  updates: Partial<Flashcard>
): Promise<Flashcard> {
  const { data, error } = await supabase
    .from(CARDS_TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Flashcard;
}

export async function deleteFlashcard(id: string): Promise<void> {
  const { error } = await supabase
    .from(CARDS_TABLE)
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
} 