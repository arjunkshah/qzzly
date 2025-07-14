import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchSessionById } from '@/services/supabaseSessions';
import { useAuth } from '@/contexts/AuthContext';
import Loader from '@/components/ui/Loader';
import { useToast } from '@/hooks/use-toast';

export default function StudySession() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    data: session,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['session', id],
    queryFn: () => (id ? fetchSessionById(id) : Promise.resolve(null)),
    enabled: !!id && !!user,
  });

  if (isLoading) return <Loader text="Loading session..." />;
  if (error) {
    toast({
      title: 'Error',
      description: (error as Error).message || 'Failed to load session',
      variant: 'destructive',
    });
    return <div className="text-red-500">Failed to load session.</div>;
  }
  if (!session) return <div>Session not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{session.title}</h1>
      <p className="text-gray-600 mb-4">{session.description}</p>
      <div className="text-sm text-gray-400 mb-8">
        Created: {new Date(session.createdat).toLocaleString()}<br />
        Updated: {new Date(session.updatedat).toLocaleString()}
      </div>
      {/* TODO: Add tabs/components for Files, Flashcards, Quizzes, Chat, Study Materials, etc. */}
      <div className="border-t pt-6">
        <p className="text-gray-500">Session content integration coming next...</p>
      </div>
    </div>
  );
}
