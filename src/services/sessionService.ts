import { StudySession, FileItem, Flashcard, Quiz, ChatMessage } from "@/types/session";
import { supabase } from "./supabaseClient";
import { getCurrentUser } from "./authService";

// --- Session Management ---

export const getSessions = async (): Promise<StudySession[]> => {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("createdat", { ascending: false });
  if (error) {
    console.error("Supabase error:", error);
    throw error;
  }
  
  // Ensure all sessions have default empty arrays for related data
  return (data || []).map(session => ({
    ...session,
    files: session.files || [],
    flashcards: session.flashcards || [],
    quizzes: session.quizzes || [],
    studyMaterials: session.studyMaterials || []
  }));
};

export const getSessionById = async (id: string): Promise<StudySession | null> => {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  
  if (!data) return null;
  
  // Ensure the returned session has default empty arrays for related data
  return {
    ...data,
    files: data.files || [],
    flashcards: data.flashcards || [],
    quizzes: data.quizzes || [],
    studyMaterials: data.studyMaterials || []
  };
};

export const createSession = async (sessionData: Partial<StudySession>): Promise<StudySession> => {
  const currentUser = getCurrentUser();
  if (!currentUser) throw new Error("User must be logged in to create sessions");

  // Ensure user exists in users table
  const { data: userExists, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("id", currentUser.id)
    .single();
  if (userError || !userExists) {
    console.log("User not found in users table, inserting user...");
    const { error: insertUserError } = await supabase
      .from("users")
      .insert([
        {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          subscription: currentUser.subscription,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        },
      ]);
    if (insertUserError) {
      console.error("Failed to insert user:", insertUserError);
      throw insertUserError;
    }
  }

  // Remove id if present to avoid conflict with unique constraint
  const { id, ...rest } = sessionData;
  const payload = { ...rest, user_id: currentUser.id };
  console.log('Creating session with payload:', payload);
  const { data, error } = await supabase
    .from("sessions")
    .insert([payload])
    .select()
    .single();
  if (error) {
    console.error('Supabase createSession error:', error);
    throw error;
  }
  
  // Ensure the returned session has default empty arrays for related data
  return {
    ...data,
    files: data.files || [],
    flashcards: data.flashcards || [],
    quizzes: data.quizzes || [],
    studyMaterials: data.studyMaterials || []
  };
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