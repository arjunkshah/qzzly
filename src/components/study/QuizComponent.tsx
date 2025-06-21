import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Quiz, Question, FileItem, Flashcard } from "@/types/session";
import { addQuiz, generateContentWithOpenAI, getSessionById } from "@/services/sessionService";
import { Check, Plus, Sparkles, Settings, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuizComponentProps {
  sessionId: string;
  quizzes: Quiz[];
  files: FileItem[];
  flashcards: Flashcard[];
  onQuizAdded: (quiz: Quiz) => void;
}

export function QuizComponent({ 
  sessionId, 
  quizzes, 
  onQuizAdded 
}: QuizComponentProps) {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quizSettings, setQuizSettings] = useState({
    questionCount: 5,
    difficulty: "medium",
    topic: "",
    showExplanations: true,
    questionTypes: ["multiple-choice"] as string[]
  });
  const { toast } = useToast();

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setQuizCompleted(false);
  };

  const handleAnswerSelection = (answer: number) => {
    if (!isAnswered) {
      setSelectedAnswer(answer);
    }
  };

  const checkAnswer = () => {
    if (selectedAnswer === null || !activeQuiz) return;
    
    setIsAnswered(true);
    if (selectedAnswer === activeQuiz.questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (!activeQuiz) return;
    
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const goToPreviousQuestion = () => {
    if (!activeQuiz || currentQuestionIndex === 0) return;
    
    setCurrentQuestionIndex(currentQuestionIndex - 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
  };

  const handleGenerateQuiz = async () => {
    setAiGenerating(true);
    try {
      // Get session to check file content
      const session = await getSessionById(sessionId);
      
      if (!session || session.files.length === 0) {
        toast({
          title: "No study materials",
          description: "Please upload PDF files first to generate quiz questions from your content",
          variant: "destructive",
        });
        setAiGenerating(false);
        return;
      }
      
      // Build prompt based on settings
      const fileContext = session.files.map(file => file.name.replace('.pdf', '')).join(", ");
      const topic = quizSettings.topic.trim() 
        ? quizSettings.topic 
        : fileContext;
        
      let prompt = `Generate a quiz about ${topic} with ${quizSettings.questionCount} questions`;
      
      // Add difficulty to prompt
      switch(quizSettings.difficulty) {
        case "easy":
          prompt += " at a beginner level";
          break;
        case "medium":
          prompt += " at an intermediate level";
          break;
        case "hard":
          prompt += " at an advanced level with challenging questions";
          break;
      }
      
      if (quizSettings.showExplanations) {
        prompt += " with detailed explanations for each correct answer";
      }
      
      const generatedQuiz = await generateContentWithOpenAI(
        prompt,
        "quiz",
        sessionId,
        {
          questionCount: quizSettings.questionCount,
          difficulty: quizSettings.difficulty,
          topic: topic,
          includeExplanations: quizSettings.showExplanations,
          questionTypes: quizSettings.questionTypes
        }
      );
      
      // Make sure we have the right number of questions (API might return more or less)
      const limitedQuestions = generatedQuiz.questions.slice(0, quizSettings.questionCount);
      
      const newQuiz: Quiz = {
        id: `quiz_${Date.now()}`,
        title: generatedQuiz.title,
        questions: limitedQuestions.map((q: any, index: number) => ({
          id: `q_${Date.now()}_${index}`,
          ...q
        }))
      };
      
      await addQuiz(sessionId, newQuiz);
      onQuizAdded(newQuiz);
      
      toast({
        title: "Success",
        description: "New quiz generated successfully"
      });
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to generate quiz",
        variant: "destructive",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Quizzes</h2>
          <p className="text-gray-600">
            Test your knowledge with interactive quizzes
          </p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Quiz Options
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Quiz Generation Settings</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Number of questions</Label>
                  <div className="flex items-center space-x-2">
                    <Slider 
                      value={[quizSettings.questionCount]} 
                      min={3} 
                      max={15} 
                      step={1}
                      onValueChange={(vals) => setQuizSettings({...quizSettings, questionCount: vals[0]})}
                      className="flex-grow"
                    />
                    <span className="w-8 text-center font-medium">{quizSettings.questionCount}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Difficulty level</Label>
                  <Select 
                    value={quizSettings.difficulty}
                    onValueChange={(value) => setQuizSettings({...quizSettings, difficulty: value})}
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
                  <Label>Specific Topic (optional)</Label>
                  <Input
                    id="topic"
                    placeholder="Leave blank to generate from uploaded files"
                    value={quizSettings.topic}
                    onChange={(e) => setQuizSettings({...quizSettings, topic: e.target.value})}
                  />
                  <p className="text-xs text-gray-500">
                    If left blank, quiz will be generated based on your study materials
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Question Types</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="multiple-choice" 
                        checked={quizSettings.questionTypes.includes("multiple-choice")}
                        onCheckedChange={(checked) => {
                          const types = checked 
                            ? [...quizSettings.questionTypes, "multiple-choice"]
                            : quizSettings.questionTypes.filter(t => t !== "multiple-choice");
                          setQuizSettings({...quizSettings, questionTypes: types.length > 0 ? types : ["multiple-choice"]});
                        }}
                      />
                      <Label htmlFor="multiple-choice">Multiple Choice</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="true-false" 
                        checked={quizSettings.questionTypes.includes("true-false")}
                        onCheckedChange={(checked) => {
                          const types = checked 
                            ? [...quizSettings.questionTypes, "true-false"]
                            : quizSettings.questionTypes.filter(t => t !== "true-false");
                          setQuizSettings({...quizSettings, questionTypes: types});
                        }}
                      />
                      <Label htmlFor="true-false">True/False</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="short-answer" 
                        checked={quizSettings.questionTypes.includes("short-answer")}
                        onCheckedChange={(checked) => {
                          const types = checked 
                            ? [...quizSettings.questionTypes, "short-answer"]
                            : quizSettings.questionTypes.filter(t => t !== "short-answer");
                          setQuizSettings({...quizSettings, questionTypes: types});
                        }}
                      />
                      <Label htmlFor="short-answer">Short Answer</Label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Select the types of questions you want in your quiz
                  </p>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="explanations" 
                    checked={quizSettings.showExplanations}
                    onCheckedChange={(checked) => 
                      setQuizSettings({...quizSettings, showExplanations: checked === true})
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="explanations">
                      Include answer explanations
                    </Label>
                    <p className="text-sm text-gray-500">
                      Show detailed explanations after answering each question
                    </p>
                  </div>
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
            onClick={handleGenerateQuiz}
            disabled={aiGenerating}
          >
            {aiGenerating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-purple-500"></div>
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate with AI
          </Button>
        </div>
      </div>
      
      {!activeQuiz ? (
        <div>
          {quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="card-hover">
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      {quiz.questions.length} questions
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="gradient-bg w-full" 
                      onClick={() => startQuiz(quiz)}
                    >
                      Start Quiz
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border rounded-lg bg-gray-50">
              <svg className="h-10 w-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              <h3 className="text-lg font-medium text-gray-900">No quizzes yet</h3>
              <p className="text-gray-500 mt-1 mb-6">
                Generate a quiz with AI based on your study materials
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Quiz Options
                </Button>
                <Button 
                  className="gradient-bg" 
                  onClick={handleGenerateQuiz}
                  disabled={aiGenerating}
                >
                  {aiGenerating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate Quiz with AI
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : quizCompleted ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <div className="w-16 h-16 rounded-full gradient-bg mx-auto flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Quiz Completed!</h3>
          <p className="text-gray-600 mb-2">
            Your score: {score} out of {activeQuiz.questions.length}
          </p>
          <p className="text-gray-600 mb-6">
            {Math.round((score / activeQuiz.questions.length) * 100)}% correct
          </p>
          
          <div className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => startQuiz(activeQuiz)}
            >
              Retry Quiz
            </Button>
            <Button 
              className="gradient-bg"
              onClick={() => setActiveQuiz(null)}
            >
              Back to Quizzes
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <div className="border-b p-6">
            <h3 className="text-xl font-semibold">{activeQuiz.title}</h3>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">
                Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
              </span>
              <Button 
                variant="ghost" 
                onClick={() => setActiveQuiz(null)}
              >
                Exit Quiz
              </Button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-8">
              <h4 className="text-lg font-medium mb-4">
                {activeQuiz.questions[currentQuestionIndex].text}
              </h4>
              
              <RadioGroup 
                value={selectedAnswer?.toString()} 
                onValueChange={(value) => handleAnswerSelection(parseInt(value))}
                className="space-y-3"
                disabled={isAnswered}
              >
                {activeQuiz.questions[currentQuestionIndex].options.map((option, index) => {
                  const isCorrectAnswer = index === activeQuiz.questions[currentQuestionIndex].correctAnswer;
                  const isSelectedAnswer = selectedAnswer === index;
                  const isUserCorrect = isAnswered && isSelectedAnswer && isCorrectAnswer;
                  const isUserIncorrect = isAnswered && isSelectedAnswer && !isCorrectAnswer;
                  const shouldShowCorrect = isAnswered && isCorrectAnswer;
                  
                  let optionClasses = "flex items-center space-x-3 p-4 rounded-md border ";
                  
                  if (isAnswered) {
                    if (shouldShowCorrect) {
                      optionClasses += "border-green-500 bg-green-50";
                    } else if (isUserIncorrect) {
                      optionClasses += "border-red-500 bg-red-50";
                    } else {
                      optionClasses += "border-gray-200";
                    }
                  } else if (isSelectedAnswer) {
                    optionClasses += "border-purple-500 bg-purple-50";
                  } else {
                    optionClasses += "border-gray-200 hover:border-gray-300";
                  }
                  
                  return (
                  <div 
                    key={index} 
                      className={optionClasses}
                  >
                    <RadioGroupItem 
                      value={index.toString()} 
                      id={`option-${index}`} 
                    />
                    <Label 
                      htmlFor={`option-${index}`}
                      className="flex-grow cursor-pointer"
                    >
                      {option}
                    </Label>
                      {isAnswered && isCorrectAnswer && (
                        <Check className="h-5 w-5 text-green-600" />
                      )}
                      {isAnswered && isUserIncorrect && (
                        <X className="h-5 w-5 text-red-600" />
                      )}
                  </div>
                  );
                })}
              </RadioGroup>
            </div>
            
            {isAnswered && (
              <div className={`p-4 rounded-md ${
                selectedAnswer === activeQuiz.questions[currentQuestionIndex].correctAnswer 
                  ? "bg-green-50 border border-green-200" 
                  : "bg-red-50 border border-red-200"
              } mb-6`}>
                <p className={`font-medium mb-1 ${
                  selectedAnswer === activeQuiz.questions[currentQuestionIndex].correctAnswer 
                    ? "text-green-600" 
                    : "text-red-600"
                }`}>
                  {selectedAnswer === activeQuiz.questions[currentQuestionIndex].correctAnswer 
                    ? "Correct!" 
                    : "Incorrect"}
                </p>
                <p className="text-gray-700">
                  {activeQuiz.questions[currentQuestionIndex].explanation || "No explanation available."}
                </p>
              </div>
            )}
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                disabled={currentQuestionIndex === 0 || !isAnswered}
                onClick={goToPreviousQuestion}
              >
                Previous
              </Button>
              
              {!isAnswered ? (
                <Button 
                  className="gradient-bg" 
                  onClick={checkAnswer}
                  disabled={selectedAnswer === null}
                >
                  Check Answer
                </Button>
              ) : (
                <Button 
                  className="gradient-bg" 
                  onClick={nextQuestion}
                >
                  {currentQuestionIndex < activeQuiz.questions.length - 1 ? "Next Question" : "Finish Quiz"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
