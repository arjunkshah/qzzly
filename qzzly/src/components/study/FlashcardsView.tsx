import React, { useState, useEffect } from 'react';
import { StudyFile, Flashcard } from '../../types/session';
import ViewContainer from '../ui/ViewContainer';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { generateFlashcards } from '../../services/geminiService';

const FlashcardsView: React.FC<{ files: StudyFile[] }> = ({ files }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateFlashcards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const generated = await generateFlashcards(files);
      setFlashcards(generated);
      setCurrentIndex(0);
      setShowAnswer(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const generateFlashcards = async () => {
      if (files.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        // For now, create sample flashcards
        const sampleFlashcards: Flashcard[] = [
          { id: '1', front: 'What is the main topic?', back: 'Document analysis and study', mastered: false },
          { id: '2', front: 'How many files were uploaded?', back: `${files.length} file(s)`, mastered: false },
          { id: '3', front: 'What type of content is this?', back: 'Study materials and documents', mastered: false },
        ];
        setFlashcards(sampleFlashcards);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate flashcards');
      } finally {
        setIsLoading(false);
      }
    };

    generateFlashcards();
  }, [files]);

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  const toggleMastered = () => {
    const updatedCards = [...flashcards];
    updatedCards[currentIndex].mastered = !updatedCards[currentIndex].mastered;
    setFlashcards(updatedCards);
  };

  if (isLoading) {
    return (
      <ViewContainer title="Flashcards" isLoading={isLoading} error={error}>
      <div className="flex justify-center items-center h-32">Generating flashcards...</div>
    </ViewContainer>
  );
}

if (error) {
  return (
    <ViewContainer title="Flashcards" isLoading={isLoading} error={error}>
      <div className="flex justify-center items-center h-32 text-red-500">{error}</div>
    </ViewContainer>
  );
}

if (flashcards.length === 0) {
  return (
    <ViewContainer title="Flashcards" isLoading={false} error={null}>
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center text-gray-500 mb-4">No flashcards available yet.</div>
        <Button onClick={handleGenerateFlashcards} className="px-6 py-3 text-lg rounded-lg shadow-md bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 transition">Generate Flashcards</Button>
      </div>
    </ViewContainer>
  );
}

const currentCard = flashcards[currentIndex];

return (
  <ViewContainer title="Flashcards" isLoading={isLoading} error={error}>
    <div className="flex flex-col items-center space-y-8">
      <div className="text-base text-gray-500 mb-2">
        Card {currentIndex + 1} of {flashcards.length}
      </div>
      <div className="w-full flex justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xl text-center border border-gray-200">
          <div className="text-2xl font-bold mb-4">{currentCard.front}</div>
          {showAnswer && (
            <div className="text-lg text-gray-700 border-t pt-4 mt-4">{currentCard.back}</div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-4 mt-6">
        <Button onClick={prevCard} disabled={currentIndex === 0} className="min-w-[120px]">Previous</Button>
        <Button onClick={() => setShowAnswer(!showAnswer)} className="min-w-[140px]">{showAnswer ? 'Hide Answer' : 'Show Answer'}</Button>
        <Button onClick={nextCard} disabled={currentIndex === flashcards.length - 1} className="min-w-[120px]">Next</Button>
      </div>
      <div className="flex justify-center mt-4">
        <Button 
          variant={currentCard.mastered ? "default" : "outline"}
          onClick={toggleMastered}
          className="min-w-[180px]"
        >
          {currentCard.mastered ? 'Mastered' : 'Mark as Mastered'}
        </Button>
      </div>
    </div>
  </ViewContainer>
);
};

export default FlashcardsView; 