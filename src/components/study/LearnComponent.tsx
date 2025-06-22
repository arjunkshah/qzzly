import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flashcard, StudyMaterial, FileItem } from "@/types/session";
import { toggleFlashcardMastery } from "@/services/sessionService";
import { generateStudyMaterial, generateLongAnswer } from "@/services/openaiService";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Check, X, ArrowLeft, ArrowRight, Lightbulb, BookText, MessageSquare, BrainCircuit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface LearnComponentProps {
  sessionId: string;
  flashcards: Flashcard[];
  studyMaterials?: StudyMaterial[];
  files?: FileItem[];
}

export function LearnComponent({ sessionId, flashcards, studyMaterials = [], files = [] }: LearnComponentProps) {
  // Flashcard state
  const [currentCards, setCurrentCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress, setProgress] = useState(0);
  const [remainingCount, setRemainingCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const { toast } = useToast();
  
  // Study material generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState<"notes" | "outline" | "summary">("notes");
  const [complexity, setComplexity] = useState("medium");
  const [studyMaterialContent, setStudyMaterialContent] = useState<StudyMaterial | null>(null);

  // Long answer state
  const [question, setQuestion] = useState("");
  const [answerComplexity, setAnswerComplexity] = useState("medium");
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [longAnswer, setLongAnswer] = useState("");

  useEffect(() => {
    // Filter out mastered cards and shuffle the remaining ones
    const unmasteredCards = flashcards.filter(card => !card.mastered);
    setCurrentCards(shuffleArray([...unmasteredCards]));
    setCurrentIndex(0);
    setIsFlipped(false);
    setRemainingCount(unmasteredCards.length);
    setMasteredCount(flashcards.length - unmasteredCards.length);
    
    const totalCards = flashcards.length;
    const masteredPercentage = totalCards > 0 
      ? Math.round((flashcards.filter(card => card.mastered).length / totalCards) * 100) 
      : 0;
    setProgress(masteredPercentage);
    
  }, [flashcards]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleMarkMastered = async () => {
    if (currentCards.length === 0) return;
    
    const currentCard = currentCards[currentIndex];
    try {
      await toggleFlashcardMastery(sessionId, currentCard.id);
      
      // Remove the card from current deck
      const updatedCards = currentCards.filter(card => card.id !== currentCard.id);
      setCurrentCards(updatedCards);
      setRemainingCount(updatedCards.length);
      setMasteredCount(masteredCount + 1);
      
      // Update progress
      const totalCards = flashcards.length;
      const newMasteredPercentage = totalCards > 0 
        ? Math.round(((masteredCount + 1) / totalCards) * 100) 
        : 0;
      setProgress(newMasteredPercentage);
      
      // Reset for next card
      setIsFlipped(false);
      setCurrentIndex(currentIndex >= updatedCards.length ? 0 : currentIndex);
      
      toast({
        title: "Marked as mastered",
        description: "You've mastered this flashcard!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update flashcard",
        variant: "destructive",
      });
    }
  };

  const handleKeepPracticing = () => {
    if (currentCards.length === 0) return;
    
    // Move current card to the end of the deck
    const updatedCards = [...currentCards];
    const currentCard = updatedCards.splice(currentIndex, 1)[0];
    updatedCards.push(currentCard);
    
    setCurrentCards(updatedCards);
    setIsFlipped(false);
    
    // If we removed the last card in the deck, go back to the first one
    setCurrentIndex(currentIndex >= updatedCards.length - 1 ? 0 : currentIndex);
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentIndex((currentIndex + 1) % currentCards.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentIndex((currentIndex - 1 + currentCards.length) % currentCards.length);
  };

  const handleRestartAllCards = () => {
    // Reset all cards to unmastered state
    const allCards = shuffleArray([...flashcards]);
    setCurrentCards(allCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRemainingCount(allCards.length);
    setMasteredCount(0);
    setProgress(0);
  };
  
  const generateStudyMaterial = async () => {
    if (!topic) {
      toast({
        title: "Topic required",
        description: "Please enter a topic for your study material",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    setStudyMaterialContent(null);
    try {
      const materialContent = await generateStudyMaterial(
        topic,
        format,
        complexity,
        files,
        sessionId
      );
      
      const newMaterial: StudyMaterial = {
        id: `sm-${Date.now()}`,
        title: topic,
        content: materialContent,
        format,
        complexity,
        createdAt: new Date().toISOString()
      };

      setStudyMaterialContent(newMaterial);

      toast({
        title: "Study material generated",
        description: "Your study material has been created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate study material",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const generateAnswer = async () => {
    if (!question) {
      toast({
        title: "Question required",
        description: "Please enter a question to generate an answer",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingAnswer(true);
    setLongAnswer("");
    try {
      const answer = await generateLongAnswer(
        question,
        answerComplexity,
        files,
        sessionId
      );
      
      setLongAnswer(answer);
      toast({
        title: "Answer generated",
        description: "Long-form answer has been generated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate answer",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  return (
    <div>
      <Tabs defaultValue="longAnswer" className="w-full">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="flashcards" className="flex-1">
            <BookOpen className="h-4 w-4 mr-2" />
            Flashcards
          </TabsTrigger>
          <TabsTrigger value="longAnswer" className="flex-1">
            <BrainCircuit className="h-4 w-4 mr-2" />
            Ask Questions
          </TabsTrigger>
          <TabsTrigger value="material" className="flex-1">
            <BookText className="h-4 w-4 mr-2" />
            Study Materials
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="flashcards">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Flashcard Review</h2>
              <p className="text-gray-600">
                Practice your flashcards until you master them
              </p>
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Mastery Progress</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
              <div>
                <span className="font-medium text-purple-600">{masteredCount}</span> mastered
              </div>
              <div>
                <span className="font-medium text-purple-600">{remainingCount}</span> remaining
              </div>
            </div>
          </div>
          
          {currentCards.length > 0 ? (
            <div>
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
                        {currentCards[currentIndex]?.front}
                      </p>
                      <p className="text-gray-400 text-sm mt-4">Click to flip</p>
                    </div>
                    
                    {/* Back of card */}
                    <div className="absolute w-full h-full bg-purple-50 rounded-xl p-8 border-2 border-purple-200 shadow-md backface-hidden rotate-y-180 flex flex-col items-center justify-center">
                      <p className="text-center text-lg">
                        {currentCards[currentIndex]?.back}
                      </p>
                      <p className="text-gray-400 text-sm mt-4">Click to flip back</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-6">
                <Button 
                  variant="outline" 
                  onClick={handlePrevCard}
                  disabled={currentCards.length <= 1}
                  className="flex items-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleNextCard}
                  disabled={currentCards.length <= 1}
                  className="flex items-center"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button 
                  variant="outline" 
                  className="border-red-300 text-red-600 hover:bg-red-50 flex-1 md:flex-none"
                  onClick={handleKeepPracticing}
                >
                  <X className="mr-2 h-4 w-4" />
                  Need More Practice
                </Button>
                
                <Button 
                  variant="outline" 
                  className="border-green-300 text-green-600 hover:bg-green-50 flex-1 md:flex-none"
                  onClick={handleMarkMastered}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Mark as Mastered
                </Button>
              </div>
            </div>
          ) : flashcards.length === 0 ? (
            <div className="text-center py-16 border rounded-lg bg-gray-50">
              <BookOpen className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No flashcards to learn</h3>
              <p className="text-gray-500 mt-1 mb-6">
                Create flashcards first in the Flashcards tab
              </p>
            </div>
          ) : (
            <div className="text-center py-16 border rounded-lg bg-purple-50">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">All cards mastered!</h3>
              <p className="text-gray-600 mb-6">
                Congratulations! You've mastered all your flashcards.
              </p>
              <Button 
                className="gradient-bg" 
                onClick={handleRestartAllCards}
              >
                Restart All Cards
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="longAnswer">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Ask Deep Questions</h2>
              <p className="text-gray-600">
                Get comprehensive answers to complex questions about your study materials
              </p>
              {files.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-green-600 font-medium">
                    {files.length} file{files.length > 1 ? 's' : ''} available for context
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Ask a Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question">Your Question</Label>
                  <Textarea
                    id="question"
                    placeholder="Enter a detailed question (e.g., 'Explain how the Holocaust impacted international law and human rights frameworks')"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="h-32"
                  />
                </div>
                
                <div>
                  <Label>Answer Complexity</Label>
                  <RadioGroup value={answerComplexity} onValueChange={setAnswerComplexity} className="flex mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="simple" id="simple-answer" />
                      <Label htmlFor="simple-answer">Simple</Label>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <RadioGroupItem value="medium" id="medium-answer" />
                      <Label htmlFor="medium-answer">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <RadioGroupItem value="advanced" id="advanced-answer" />
                      <Label htmlFor="advanced-answer">Advanced</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Button 
                  onClick={generateAnswer} 
                  disabled={isGeneratingAnswer}
                  className="w-full"
                >
                  {isGeneratingAnswer ? (
                    "Generating..."
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Generate Answer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {longAnswer && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Answer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: longAnswer.replace(/\n/g, '<br>') 
                    }} 
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="material">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold">Study Materials</h2>
              {files.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{files.length} file{files.length > 1 ? 's' : ''} available</span>
                </div>
              )}
            </div>
            <p className="text-gray-600">
              Generate study materials and practice with flashcards
            </p>
          </div>
          
          {studyMaterials.length > 0 || studyMaterialContent ? (
            <div className="mb-6">
              {studyMaterialContent && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>{studyMaterialContent.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: studyMaterialContent.content.replace(/\n/g, '<br>') 
                        }} 
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {studyMaterials.map((material) => (
                <Card key={material.id} className="mb-6">
                  <CardHeader>
                    <CardTitle>{material.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: material.content.replace(/\n/g, '<br>') 
                        }} 
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border rounded-lg bg-gray-50 mb-6">
              <BookText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No study materials yet</h3>
              <p className="text-gray-500 mt-1 mb-6">
                Generate comprehensive study materials below
              </p>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Generate New Study Material</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="Enter topic (e.g., 'The Holocaust and World War II')"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Format</Label>
                  <RadioGroup value={format} onValueChange={(value) => setFormat(value as "notes" | "outline" | "summary")} className="flex mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="notes" id="notes" />
                      <Label htmlFor="notes">Notes</Label>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <RadioGroupItem value="outline" id="outline" />
                      <Label htmlFor="outline">Outline</Label>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <RadioGroupItem value="summary" id="summary" />
                      <Label htmlFor="summary">Summary</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div>
                  <Label>Complexity</Label>
                  <RadioGroup value={complexity} onValueChange={setComplexity} className="flex mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="simple" id="simple" />
                      <Label htmlFor="simple">Simple</Label>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <RadioGroupItem value="advanced" id="advanced" />
                      <Label htmlFor="advanced">Advanced</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Button 
                  onClick={generateStudyMaterial} 
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    "Generating..."
                  ) : (
                    <>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Generate Study Material
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
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
