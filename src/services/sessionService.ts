import { StudySession, FileItem, Flashcard, Quiz, ChatMessage } from "@/types/session";
import { supabase } from "./supabaseClient";
import { getCurrentUser } from "./authService";

// --- Session Management ---

export const getSessions = async (): Promise<StudySession[]> => {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getSessionById = async (id: string): Promise<StudySession | null> => {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
};

export const createSession = async (sessionData: Partial<StudySession>): Promise<StudySession> => {
  const currentUser = getCurrentUser();
  if (!currentUser) throw new Error("User must be logged in to create sessions");
  const { data, error } = await supabase
    .from("sessions")
    .insert([{ ...sessionData, user_id: currentUser.id }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteSession = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", id);
  if (error) throw error;
};

export const updateSession = async (id: string, updates: Partial<StudySession>): Promise<StudySession> => {
  const { data, error } = await supabase
    .from("sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// --- File Management ---

export const addFileToSession = async (sessionId: string, file: Omit<FileItem, 'id' | 'url' | 'uploadedAt'>): Promise<FileItem> => {
  const { data, error } = await supabase
    .from("files")
    .insert([{ ...file, session_id: sessionId }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const removeFileFromSession = async (sessionId: string, fileId: string): Promise<void> => {
  const { error } = await supabase
    .from("files")
    .delete()
    .eq("id", fileId)
    .eq("session_id", sessionId);
  if (error) throw error;
};

// --- Chat Messages ---

export const getChatMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("timestamp", { ascending: true });
  if (error) throw error;
  return data || [];
};

export const addChatMessage = async (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> => {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert([{ ...message, session_id: sessionId }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// --- Flashcards ---

export const addFlashcards = async (sessionId: string, flashcards: Omit<Flashcard, 'id'>[]): Promise<Flashcard[]> => {
  const inserts = flashcards.map(f => ({ ...f, session_id: sessionId }));
  const { data, error } = await supabase
    .from("flashcards")
    .insert(inserts)
    .select();
  if (error) throw error;
  return data || [];
};

export const toggleFlashcardMastery = async (sessionId: string, flashcardId: string): Promise<Flashcard> => {
  // Fetch current state
  const { data: card, error: fetchError } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", flashcardId)
    .eq("session_id", sessionId)
    .single();
  if (fetchError || !card) throw fetchError || new Error("Flashcard not found");
  // Toggle
  const { data, error } = await supabase
    .from("flashcards")
    .update({ mastered: !card.mastered })
    .eq("id", flashcardId)
    .eq("session_id", sessionId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// --- Quizzes ---

export const addQuiz = async (sessionId: string, quiz: Omit<Quiz, 'id'>): Promise<Quiz> => {
  const { data, error } = await supabase
    .from("quizzes")
    .insert([{ ...quiz, session_id: sessionId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}; 