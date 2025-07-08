import React, { useState, useEffect } from 'react';
import { StudyFile, Flashcard } from '../../types/session';
import ViewContainer from '../ui/ViewContainer';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { generateFlashcards } from '../../services/geminiService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';

const FlashcardsView: React.FC<{ files: StudyFile[] }> = ({ files }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [flashcardSettings, setFlashcardSettings] = useState({
    count: 15,
    difficulty: 'medium',
    topic: '',
  });

  const handleGenerateFlashcards = async () => {
    setIsLoading(true);
    setError(null);
    setSettingsOpen(false);
    try {
      const generated = await generateFlashcards(files, flashcardSettings.count, flashcardSettings.difficulty, flashcardSettings.topic);
      setFlashcards(generated);
      setCurrentIndex(0);
      setShowAnswer(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove useEffect entirely (no auto-generation)

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
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button className="px-6 py-3 text-lg rounded-lg shadow-md bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 transition">Generate Flashcards</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Flashcard Generation Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="font-medium">Number of flashcards</label>
                <div className="flex items-center space-x-2">
                  <Slider 
                    value={[flashcardSettings.count]} 
                    min={5} 
                    max={30} 
                    step={1}
                    onValueChange={(vals) => setFlashcardSettings({...flashcardSettings, count: vals[0]})}
                    className="flex-grow"
                  />
                  <span className="w-8 text-center font-medium">{flashcardSettings.count}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-medium">Difficulty level</label>
                <Select 
                  value={flashcardSettings.difficulty}
                  onValueChange={(value) => setFlashcardSettings({...flashcardSettings, difficulty: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="font-medium">Specific Topic (optional)</label>
                <Input
                  id="topic"
                  placeholder="Leave blank to generate from uploaded files"
                  value={flashcardSettings.topic}
                  onChange={(e) => setFlashcardSettings({...flashcardSettings, topic: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleGenerateFlashcards} className="w-full py-3 text-lg">Generate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ViewContainer>
  );
}

  const currentCard = flashcards[currentIndex];

  return (
    <ViewContainer title="Flashcards" isLoading={isLoading} error={error}>
    <div className="flex flex-col items-center space-y-10">
      <div className="text-base text-gray-500 mb-2">
        Card {currentIndex + 1} of {flashcards.length}
      </div>
      <div className="w-full flex justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 w-full max-w-2xl min-h-[320px] flex flex-col justify-center items-center border border-gray-200 transition-all duration-300">
          <div className="text-3xl font-extrabold mb-6 text-gray-900">{currentCard.front}</div>
          {showAnswer && (
            <div className="text-2xl text-gray-700 border-t pt-8 mt-8 w-full text-center">{currentCard.back}</div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-6 mt-10">
        <Button onClick={prevCard} disabled={currentIndex === 0} className="min-w-[140px] py-3 text-lg">Previous</Button>
        <Button onClick={() => setShowAnswer(!showAnswer)} className="min-w-[180px] py-3 text-lg">{showAnswer ? 'Hide Answer' : 'Show Answer'}</Button>
        <Button onClick={nextCard} disabled={currentIndex === flashcards.length - 1} className="min-w-[140px] py-3 text-lg">Next</Button>
      </div>
      <div className="flex justify-center mt-6">
        <Button 
          variant={currentCard.mastered ? "default" : "outline"}
          onClick={toggleMastered}
          className="min-w-[220px] py-3 text-lg"
        >
          {currentCard.mastered ? 'Mastered' : 'Mark as Mastered'}
        </Button>
      </div>
    </div>
  </ViewContainer>
  );
};

export default FlashcardsView; 