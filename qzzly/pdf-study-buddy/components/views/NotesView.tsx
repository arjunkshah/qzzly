
import React, { useState, useEffect, useCallback } from 'react';
import { generateNotes } from '../../services/geminiService';
import { StudyFile } from '../../types';
import ViewContainer from './ViewContainer';
import MarkdownRenderer from '../MarkdownRenderer';

interface NotesViewProps {
  files: StudyFile[];
}

const NotesView: React.FC<NotesViewProps> = ({ files }) => {
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateNotes(files);
      setNotes(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate notes.');
    } finally {
      setIsLoading(false);
    }
  }, [files]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return (
    <ViewContainer title="Study Notes" isLoading={isLoading} error={error}>
      <MarkdownRenderer content={notes} />
    </ViewContainer>
  );
};

export default NotesView;
