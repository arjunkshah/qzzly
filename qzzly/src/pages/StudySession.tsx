import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NavBar } from "@/components/NavBar";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
// TODO: Implement SessionService.getSession, addChatMessage, getChatMessages
import { SessionService } from "@/services/sessionService";
import { StudySession as StudySessionType, ChatMessage, FileItem, Flashcard } from "@/types/session";
import { ArrowLeft, File, Plus, Send, Upload, Check, X, Book, BookOpen, MessageSquare, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FlashcardComponent } from "@/components/study/FlashcardComponent";
import { QuizComponent } from "@/components/study/QuizComponent";
import { ChatComponent } from "@/components/study/ChatComponent";
import { FilesComponent } from "@/components/study/FilesComponent";
import { LearnComponent } from "@/components/study/LearnComponent";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useQuery } from "@tanstack/react-query";

export default function StudySession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<StudySessionType | null>(null);
  const [activeTab, setActiveTab] = useState("files");
  const mainRef = useScrollAnimation<HTMLDivElement>();

  const { isLoading, error, data } = useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      const result = await SessionService.getSession(id ?? "");
      if (result.error || !result.session) {
        throw new Error(result.error || "Session not found");
      }
      // Transform Session to StudySession
      return {
        id: result.session.id,
        title: result.session.title,
        description: result.session.description || "",
        createdat: result.session.created_at,
        updatedat: result.session.updated_at,
        files: [],
        flashcards: [],
        quizzes: [],
        studyMaterials: []
      };
    },
    enabled: !!id,
    retry: 1,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (data) {
      console.log("Session query success:", { id, data });
      setSession(data);
    } else if (error) {
      console.error("Session query error:", { id, error });
      toast({
        title: "Error",
        description: "Failed to load study session",
        variant: "destructive",
      });
      navigate('/sessions');
    } else if (!isLoading && !data) {
      console.log("Session not found for ID:", id);
      toast({
        title: "Error",
        description: "Study session not found",
        variant: "destructive",
      });
      navigate('/sessions');
    }
  }, [data, error, isLoading, id, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-700">Session not found</h1>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => navigate('/sessions')}
            >
              Go back to sessions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <div ref={mainRef} className="container mx-auto px-4 py-6">
        {/* Header with back button */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            className="mb-4"
            onClick={() => navigate('/sessions')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
          <h1 className="text-3xl font-bold">{session.title}</h1>
          <p className="text-gray-600 mt-1">{session.description}</p>
        </div>
        
        {/* Study session tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="files" className="flex items-center">
              <File className="mr-2 h-4 w-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="flex items-center">
              <Book className="mr-2 h-4 w-4" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center">
              <Check className="mr-2 h-4 w-4" />
              Quiz
            </TabsTrigger>
            <TabsTrigger value="learn" className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" />
              Learn
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>
          
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <TabsContent value="files">
              <FilesComponent 
                sessionId={session.id} 
                files={session.files} 
                onFileAdded={(file) => {
                  setSession({
                    ...session,
                    files: [...session.files, file]
                  });
                }}
              />
            </TabsContent>
            
            <TabsContent value="flashcards">
              <FlashcardComponent 
                sessionId={session.id} 
                flashcards={session.flashcards}
                files={session.files}
                onFlashcardAdded={(flashcard) => {
                  setSession(prevSession => ({
                    ...prevSession,
                    flashcards: [...prevSession.flashcards, flashcard]
                  }));
                }}
                onFlashcardsAdded={(flashcards) => {
                  setSession(prevSession => ({
                    ...prevSession,
                    flashcards: [...prevSession.flashcards, ...flashcards]
                  }));
                }}
                onMasteryToggled={(id, mastered) => {
                  setSession(prevSession => ({
                    ...prevSession,
                    flashcards: prevSession.flashcards.map(card => 
                      card.id === id ? { ...card, mastered: !card.mastered } : card
                    )
                  }));
                }}
              />
            </TabsContent>
            
            <TabsContent value="quiz">
              <QuizComponent 
                sessionId={session.id} 
                quizzes={session.quizzes}
                files={session.files}
                flashcards={session.flashcards}
                onQuizAdded={(quiz) => {
                  setSession({
                    ...session,
                    quizzes: [...session.quizzes, { ...quiz, id: `quiz_${Date.now()}`}]
                  });
                }}
              />
            </TabsContent>
            
            <TabsContent value="learn">
              <LearnComponent 
                sessionId={session.id}
                flashcards={session.flashcards}
                studyMaterials={session.studyMaterials || []}
                files={session.files}
              />
            </TabsContent>
            
            <TabsContent value="chat">
              <ChatComponent 
                sessionId={session.id}
                files={session.files}
                onFileUploaded={(file) => {
                  setSession({
                    ...session,
                    files: [...session.files, file]
                  });
                }}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
