import React, { useState, useEffect } from 'react';
import { StudyFile, Flashcard } from '../../types/session';
import ViewContainer from '../ui/ViewContainer';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

const FlashcardsView: React.FC<{ files: StudyFile[] }> = ({ files }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
        <div></div>
      </ViewContainer>
    );
  }

  if (error) {
    return (
      <ViewContainer title="Flashcards" isLoading={isLoading} error={error}>
        <div></div>
      </ViewContainer>
    );
  }

  if (flashcards.length === 0) {
    return (
      <ViewContainer title="Flashcards" isLoading={false} error={null}>
        <div className="text-center text-gray-500">No flashcards available</div>
      </ViewContainer>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <ViewContainer title="Flashcards" isLoading={isLoading} error={error}>
      <div className="flex flex-col items-center space-y-6">
        <div className="text-sm text-gray-500">
          Card {currentIndex + 1} of {flashcards.length}
        </div>
        
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-lg font-semibold">
                {currentCard.front}
              </div>
              
              {showAnswer && (
                <div className="text-gray-700 border-t pt-4">
                  {currentCard.back}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex space-x-4">
          <Button onClick={prevCard} disabled={currentIndex === 0}>
            Previous
          </Button>
          <Button onClick={() => setShowAnswer(!showAnswer)}>
            {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </Button>
          <Button onClick={nextCard} disabled={currentIndex === flashcards.length - 1}>
            Next
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <Button 
            variant={currentCard.mastered ? "default" : "outline"}
            onClick={toggleMastered}
          >
            {currentCard.mastered ? 'Mastered' : 'Mark as Mastered'}
          </Button>
        </div>
      </div>
    </ViewContainer>
  );
};

export default FlashcardsView; 