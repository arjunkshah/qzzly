import { supabase } from '@/lib/supabaseClient';
import { Quiz, Question } from '@/types/session';

const QUIZZES_TABLE = 'quizzes';
const QUESTIONS_TABLE = 'questions';

export async function fetchQuizzes(sessionId: string): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from(QUIZZES_TABLE)
    .select('*, questions:questions(*)')
    .eq('session_id', sessionId)
    .order('createdAt', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Quiz[];
}

export async function createQuiz(
  sessionId: string,
  userId: string,
  title: string
): Promise<Quiz> {
  const { data, error } = await supabase
    .from(QUIZZES_TABLE)
    .insert({
      session_id: sessionId,
      user_id: userId,
      title,
      createdAt: new Date().toISOString(),
    })
    .select('*, questions:questions(*)')
    .single();
  if (error) throw new Error(error.message);
  return data as Quiz;
}

export async function deleteQuiz(id: string): Promise<void> {
  const { error } = await supabase
    .from(QUIZZES_TABLE)
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function addQuestion(
  quizId: string,
  text: string,
  options: string[],
  correctAnswer: number,
  explanation: string
): Promise<Question> {
  const { data, error } = await supabase
    .from(QUESTIONS_TABLE)
    .insert({
      quiz_id: quizId,
      text,
      options,
      correctAnswer,
      explanation,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Question;
}

export async function updateQuestion(
  id: string,
  updates: Partial<Question>
): Promise<Question> {
  const { data, error } = await supabase
    .from(QUESTIONS_TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Question;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from(QUESTIONS_TABLE)
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
} 