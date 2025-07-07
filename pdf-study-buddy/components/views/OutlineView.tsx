
import React, { useState, useEffect, useCallback } from 'react';
import { generateOutline } from '../../services/geminiService';
import { StudyFile } from '../../types';
import ViewContainer from './ViewContainer';
import MarkdownRenderer from '../MarkdownRenderer';

interface OutlineViewProps {
  files: StudyFile[];
}

const OutlineView: React.FC<OutlineViewProps> = ({ files }) => {
  const [outline, setOutline] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOutline = useCallback(async () => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateOutline(files);
      setOutline(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate outline.');
    } finally {
      setIsLoading(false);
    }
  }, [files]);

  useEffect(() => {
    fetchOutline();
  }, [fetchOutline]);

  return (
    <ViewContainer title="Outline" isLoading={isLoading} error={error}>
       <MarkdownRenderer content={outline} />
    </ViewContainer>
  );
};

export default OutlineView;
