
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Flashcard } from "@/types/session";
import { addFlashcard, toggleFlashcardMastery, generateContentWithGemini, getSessionById, updateFlashcard } from "@/services/sessionService";
import { Book, Plus, Check, X, Sparkles, Edit, Settings } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FlashcardComponentProps {
  sessionId: string;
  flashcards: Flashcard[];
  onFlashcardAdded: (flashcard: Flashcard) => void;
  onMasteryToggled: (id: string, mastered: boolean) => void;
}

export function FlashcardComponent({ 
  sessionId, 
  flashcards, 
  onFlashcardAdded, 
  onMasteryToggled 
}: FlashcardComponentProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [generationCount, setGenerationCount] = useState(5);
  const [generationOptions, setGenerationOptions] = useState({
    count: 5,
    complexity: "medium",
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();

  const handleAddFlashcard = async () => {
    if (!front.trim() || !back.trim()) {
      toast({
        title: "Error",
        description: "Both sides of the flashcard must be filled in",
        variant: "destructive",
      });
      return;
    }

    try {
      const newFlashcard = await addFlashcard(sessionId, { front, back, mastered: false });
      // Here's the fix - we need to properly extract the flashcard from the returned session
      const addedFlashcard = newFlashcard.flashcards[newFlashcard.flashcards.length - 1];
      onFlashcardAdded(addedFlashcard);
      
      setFront("");
      setBack("");
      setDialogOpen(false);
      
      toast({
        title: "Success",
        description: "New flashcard added"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add flashcard",
        variant: "destructive",
      });
    }
  };

  const handleUpdateFlashcard = async () => {
    if (!editingFlashcard || !editingFlashcard.front.trim() || !editingFlashcard.back.trim()) {
      toast({
        title: "Error",
        description: "Both sides of the flashcard must be filled in",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateFlashcard(sessionId, editingFlashcard.id, editingFlashcard);
      
      // Update the flashcard in the local state by forcing a re-render
      const updatedFlashcards = [...flashcards];
      const index = updatedFlashcards.findIndex(f => f.id === editingFlashcard.id);
      if (index !== -1) {
        updatedFlashcards[index] = editingFlashcard;
      }
      
      setEditDialogOpen(false);
      setEditingFlashcard(null);
      
      toast({
        title: "Success",
        description: "Flashcard updated"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update flashcard",
        variant: "destructive",
      });
    }
  };

  const handleToggleMastery = async (id: string) => {
    try {
      await toggleFlashcardMastery(sessionId, id);
      onMasteryToggled(id, true);
      
      // Automatically move to next card after marking as mastered
      if (currentIndex < flashcards.length - 1) {
        handleNextCard();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update flashcard",
        variant: "destructive",
      });
    }
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentIndex((currentIndex + 1) % flashcards.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentIndex((currentIndex - 1 + flashcards.length) % flashcards.length);
  };

  const handleEditCurrentCard = () => {
    if (flashcards.length > 0) {
      setEditingFlashcard({...flashcards[currentIndex]});
      setEditDialogOpen(true);
    }
  };

  const handleGenerateFlashcards = async () => {
    setAiGenerating(true);
    try {
      // Fetch the current session to get all files
      const currentSession = await getSessionById(sessionId);
      
      if (!currentSession || currentSession.files.length === 0) {
        toast({
          title: "No study materials",
          description: "Please upload PDF files first to generate flashcards from your content",
          variant: "destructive",
        });
        setAiGenerating(false);
        return;
      }
      
      // Use existing flashcard topics if available, otherwise use file names as context
      let prompt = "";
      const count = generationOptions.count;
      const complexity = generationOptions.complexity;
      
      if (flashcards.length > 0) {
        const existingTopics = flashcards.map(fc => fc.front).join(", ");
        prompt = `Generate ${count} educational flashcards about topics similar to these: ${existingTopics.substring(0, 300)}. ${getComplexityPrompt(complexity)}`;
      } else {
        const fileNames = currentSession.files.map(file => file.name.replace('.pdf', '')).join(", ");
        prompt = `Generate ${count} educational flashcards about ${fileNames}. ${getComplexityPrompt(complexity)}`;
      }
      
      const generatedCards = await generateContentWithGemini(
        prompt,
        "flashcards",
        sessionId
      );
      
      for (const card of generatedCards) {
        const newCardResult = await addFlashcard(sessionId, { 
          front: card.front, 
          back: card.back, 
          mastered: false 
        });
        
        // Fix here too - extract the latest flashcard from the session
        const addedFlashcard = newCardResult.flashcards[newCardResult.flashcards.length - 1];
        onFlashcardAdded(addedFlashcard);
      }
      
      toast({
        title: "Success",
        description: `${generatedCards.length} flashcards generated`
      });
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate flashcards",
        variant: "destructive",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const getComplexityPrompt = (complexity: string) => {
    switch (complexity) {
      case "simple":
        return "Make them very simple and easy to understand, suitable for beginners.";
      case "medium":
        return "Make them clear and concise with moderate detail.";
      case "advanced":
        return "Make them detailed and comprehensive, suitable for advanced students.";
      default:
        return "Make them clear and concise.";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Flashcards</h2>
          <p className="text-gray-600">
            Review and memorize key concepts with flashcards
          </p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Options
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generation Settings</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Number of flashcards to generate</Label>
                  <div className="flex items-center space-x-2">
                    <Slider 
                      value={[generationOptions.count]} 
                      min={1} 
                      max={20} 
                      step={1}
                      onValueChange={(vals) => setGenerationOptions({...generationOptions, count: vals[0]})}
                      className="flex-grow"
                    />
                    <span className="w-8 text-center font-medium">{generationOptions.count}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Complexity level</Label>
                  <Select 
                    value={generationOptions.complexity}
                    onValueChange={(value) => setGenerationOptions({...generationOptions, complexity: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select complexity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={() => setSettingsOpen(false)}>
                  Save Settings
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-purple-300 text-purple-600 hover:bg-purple-50"
            onClick={handleGenerateFlashcards}
            disabled={aiGenerating}
          >
            {aiGenerating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-purple-500"></div>
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate with AI
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-bg">
                <Plus className="mr-2 h-4 w-4" />
                Add Flashcard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Flashcard</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="front">Front</Label>
                  <Textarea
                    id="front"
                    placeholder="Question or term"
                    rows={3}
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="back">Back</Label>
                  <Textarea
                    id="back"
                    placeholder="Answer or definition"
                    rows={5}
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="gradient-bg" onClick={handleAddFlashcard}>
                  Create Flashcard
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {flashcards.length > 0 ? (
        <div>
          <div className="bg-gray-100 py-4 px-6 rounded-lg mb-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{currentIndex + 1}</span> of {flashcards.length} flashcards
            </div>
            <div className="text-sm">
              <span className="text-green-600 font-medium">
                {flashcards.filter(f => f.mastered).length}
              </span> mastered
            </div>
          </div>
          
          <div className="flex justify-center mb-8">
            <div 
              className="relative w-full max-w-2xl h-64 cursor-pointer perspective-1000"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={`absolute w-full h-full transform transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front of card */}
                <div className="absolute w-full h-full bg-white rounded-xl p-8 border-2 border-purple-200 shadow-md backface-hidden flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <span className="text-purple-600 font-semibold">{currentIndex + 1}</span>
                  </div>
                  <p className="text-center text-xl font-medium">
                    {flashcards[currentIndex]?.front}
                  </p>
                  <p className="text-gray-400 text-sm mt-4">Click to flip</p>
                </div>
                
                {/* Back of card */}
                <div className="absolute w-full h-full bg-purple-50 rounded-xl p-8 border-2 border-purple-200 shadow-md backface-hidden rotate-y-180 flex flex-col items-center justify-center">
                  <p className="text-center text-lg">
                    {flashcards[currentIndex]?.back}
                  </p>
                  <p className="text-gray-400 text-sm mt-4">Click to flip back</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={handlePrevCard}
              disabled={flashcards.length <= 1}
            >
              Previous
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={handleEditCurrentCard}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              
              <Button 
                variant="outline" 
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => handleToggleMastery(flashcards[currentIndex].id)}
                disabled={flashcards[currentIndex].mastered}
              >
                <X className="mr-2 h-4 w-4" />
                Still Learning
              </Button>
              
              <Button 
                variant="outline" 
                className="border-green-300 text-green-600 hover:bg-green-50"
                onClick={() => handleToggleMastery(flashcards[currentIndex].id)}
                disabled={flashcards[currentIndex].mastered}
              >
                <Check className="mr-2 h-4 w-4" />
                Mastered
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleNextCard}
              disabled={flashcards.length <= 1}
            >
              Next
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 border rounded-lg bg-gray-50">
          <Book className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No flashcards yet</h3>
          <p className="text-gray-500 mt-1 mb-6">
            Create your first flashcard or let AI generate some for you
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              className="border-purple-300 text-purple-600 hover:bg-purple-50"
              onClick={handleGenerateFlashcards}
              disabled={aiGenerating}
            >
              {aiGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-purple-500 mr-2"></div>
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate with AI
            </Button>
            
            <Button 
              className="gradient-bg" 
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Manually
            </Button>
          </div>
        </div>
      )}
      
      {/* Edit Flashcard Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Flashcard</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-front">Front</Label>
              <Textarea
                id="edit-front"
                placeholder="Question or term"
                rows={3}
                value={editingFlashcard?.front || ""}
                onChange={(e) => setEditingFlashcard(prev => 
                  prev ? {...prev, front: e.target.value} : null
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-back">Back</Label>
              <Textarea
                id="edit-back"
                placeholder="Answer or definition"
                rows={5}
                value={editingFlashcard?.back || ""}
                onChange={(e) => setEditingFlashcard(prev => 
                  prev ? {...prev, back: e.target.value} : null
                )}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="gradient-bg" onClick={handleUpdateFlashcard}>
              Update Flashcard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <style>
        {`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .preserve-3d {
          transform-style: preserve-3d;
        }
        
        .backface-hidden {
          backface-visibility: hidden;
        }
        
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        `}
      </style>
    </div>
  );
}
