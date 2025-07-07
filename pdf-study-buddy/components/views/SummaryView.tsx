
import React, { useState, useEffect, useCallback } from 'react';
import { generateSummary } from '../../services/geminiService';
import { StudyFile } from '../../types';
import ViewContainer from './ViewContainer';
import MarkdownRenderer from '../MarkdownRenderer';

interface SummaryViewProps {
  files: StudyFile[];
}

const SummaryView: React.FC<SummaryViewProps> = ({ files }) => {
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateSummary(files);
      setSummary(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate summary.');
    } finally {
      setIsLoading(false);
    }
  }, [files]);
  
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <ViewContainer title="Summary" isLoading={isLoading} error={error}>
        <MarkdownRenderer content={summary} />
    </ViewContainer>
  );
};

export default SummaryView;
