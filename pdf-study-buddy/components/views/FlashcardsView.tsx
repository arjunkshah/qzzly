
import React, { useState, useEffect, useCallback } from 'react';
import { generateFlashcards } from '../../services/geminiService';
import { Flashcard, StudyFile } from '../../types';
import ViewContainer from './ViewContainer';

const FlashcardComponent: React.FC<{ card: Flashcard }> = ({ card }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  useEffect(() => {
      setIsFlipped(false);
  }, [card]);

  return (
    <div className="w-full h-64 perspective-1000" onClick={() => setIsFlipped(!isFlipped)}>
      <div
        className={`relative w-full h-full transform-style-preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-semibold text-center text-primary-700 dark:text-primary-300">{card.term}</h3>
        </div>
        {/* Back */}
        <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 bg-primary-100 dark:bg-primary-900 rounded-xl shadow-lg border border-primary-200 dark:border-primary-700 rotate-y-180">
          <p className="text-center text-gray-700 dark:text-gray-300">{card.definition}</p>
        </div>
      </div>
    </div>
  );
};


const FlashcardsView: React.FC<{ files: StudyFile[] }> = ({ files }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlashcards = useCallback(async () => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateFlashcards(files);
      if (result.length === 0) {
        setError("Could not generate flashcards from the document. The content might be too short or not suitable for flashcard generation.");
      }
      setFlashcards(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate flashcards.');
    } finally {
      setIsLoading(false);
    }
  }, [files]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  return (
    <ViewContainer title="Flashcards" isLoading={isLoading} error={error}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flashcards.map((card, index) => (
          <FlashcardComponent key={index} card={card} />
        ))}
      </div>
    </ViewContainer>
  );
};

export default FlashcardsView;