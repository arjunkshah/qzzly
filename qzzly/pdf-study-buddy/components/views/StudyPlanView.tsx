
import React, { useState, useEffect, useCallback } from 'react';
import { generateStudyPlan } from '../../services/geminiService';
import { StudyFile } from '../../types';
import ViewContainer from './ViewContainer';
import MarkdownRenderer from '../MarkdownRenderer';

interface StudyPlanViewProps {
  files: StudyFile[];
}

const StudyPlanView: React.FC<StudyPlanViewProps> = ({ files }) => {
  const [plan, setPlan] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateStudyPlan(files);
      setPlan(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate study plan.');
    } finally {
      setIsLoading(false);
    }
  }, [files]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  return (
    <ViewContainer title="Your 7-Day Study Plan" isLoading={isLoading} error={error} generationText="Building your personalized study plan...">
        <MarkdownRenderer content={plan} />
    </ViewContainer>
  );
};

export default StudyPlanView;
