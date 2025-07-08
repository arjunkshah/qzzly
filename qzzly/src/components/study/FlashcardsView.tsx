import React, { useState, useEffect } from 'react';
import { FlashcardSet, Flashcard } from '../../types/session';
import ViewContainer from '../ui/ViewContainer';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { generateFlashcards } from '../../services/geminiService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { SessionService } from '../../services/sessionService';
import { supabase } from '@/lib/supabase';

interface FlashcardsViewProps {
  flashcardSets: FlashcardSet[];
  onCreateSet: (set: FlashcardSet) => void;
  onUpdateSet: (set: FlashcardSet) => void;
  files: any[];
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ flashcardSets, onCreateSet, onUpdateSet, files }) => {
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [settings, setSettings] = useState({ count: 15, difficulty: 'medium', topic: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for studying a set
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // When activeSet changes, reset study state
  useEffect(() => {
    setCurrentIndex(0);
    setShowAnswer(false);
  }, [activeSetId]);

  const handleCreateSet = async () => {
      setIsLoading(true);
      setError(null);
      try {
      // Generate flashcards using Gemini with actual files
      const generated = await generateFlashcards(files, settings.count, settings.difficulty, settings.topic);
      // Save the set to Supabase
      const setName = newSetName || `Set ${flashcardSets.length + 1}`;
      const { data: savedSet, error: setError } = await supabase
        .from('flashcard_sets')
        .insert({
          session_id: files[0]?.session_id, // assumes all files are for this session
          name: setName,
          created_at: new Date().toISOString(),
          settings: settings,
        })
        .select()
        .single();
      if (setError) throw new Error(setError.message);
      // Save flashcards to Supabase
      const flashcardsToSave = generated.map((fc: any) => ({
        set_id: savedSet.id,
        front: fc.front,
        back: fc.back,
        mastered: fc.mastered || false,
      }));
      const { data: savedFlashcards, error: fcError } = await supabase
        .from('flashcards')
        .insert(flashcardsToSave)
        .select();
      if (fcError) throw new Error(fcError.message);
      const newSet: FlashcardSet = {
        id: savedSet.id,
        name: setName,
        createdAt: savedSet.created_at,
        settings: { ...settings },
        flashcards: savedFlashcards,
      };
      onCreateSet(newSet);
      setActiveSetId(newSet.id);
      setShowCreateDialog(false);
      setNewSetName('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate flashcards');
      } finally {
        setIsLoading(false);
      }
    };

  const activeSet = flashcardSets.find(set => set.id === activeSetId) || null;

  // UI: If no set is selected, show list and create button
  if (!activeSet) {
    return (
      <ViewContainer title="Flashcards" isLoading={isLoading} error={error}>
        <div className="flex flex-col items-center space-y-6">
          <div className="w-full max-w-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your Flashcard Sets</h2>
              <Button onClick={() => setShowCreateDialog(true)} className="px-4 py-2">+ New Set</Button>
            </div>
            {flashcardSets.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No flashcard sets yet.</div>
            ) : (
              <ul className="space-y-3">
                {flashcardSets.map(set => (
                  <li key={set.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-purple-50" onClick={() => setActiveSetId(set.id)}>
                    <div>
                      <div className="font-semibold">{set.name}</div>
                      <div className="text-xs text-gray-500">{set.flashcards.filter(fc => fc.mastered).length} / {set.flashcards.length} mastered</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setActiveSetId(set.id); }}>Study</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Create Set Dialog */}
          {showCreateDialog && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
              <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Create New Flashcard Set</h3>
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Set Name</label>
                  <Input value={newSetName} onChange={e => setNewSetName(e.target.value)} placeholder="e.g. Chapter 1 Vocab" />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Number of flashcards</label>
                  <Slider value={[settings.count]} min={5} max={30} step={1} onValueChange={vals => setSettings({ ...settings, count: vals[0] })} />
                  <span className="ml-2">{settings.count}</span>
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Difficulty</label>
                  <Select value={settings.difficulty} onValueChange={val => setSettings({ ...settings, difficulty: val })}>
                    <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Topic (optional)</label>
                  <Input value={settings.topic} onChange={e => setSettings({ ...settings, topic: e.target.value })} placeholder="e.g. Photosynthesis" />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateSet} disabled={isLoading}>{isLoading ? 'Generating...' : 'Create'}</Button>
                </div>
                {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
              </div>
            </div>
          )}
        </div>
      </ViewContainer>
    );
  }

  // UI: Study a set
  const flashcards = activeSet.flashcards;
  const currentCard = flashcards[currentIndex];

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
    const updatedSet = { ...activeSet, flashcards: updatedCards };
    onUpdateSet(updatedSet);
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

  return (
    <ViewContainer title={activeSet.name} isLoading={isLoading} error={error}>
      <div className="flex flex-col items-center space-y-10">
        <div className="text-base text-gray-500 mb-2">
          Card {currentIndex + 1} of {flashcards.length} | {flashcards.filter(fc => fc.mastered).length} mastered
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
        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={() => setActiveSetId(null)}>Back to Sets</Button>
        </div>
      </div>
    </ViewContainer>
  );
};

export default FlashcardsView; 