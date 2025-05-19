
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StudySession } from "@/types/session";
import { getSessions, createSession, deleteSession } from "@/services/sessionService";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Trash } from "lucide-react";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionDescription, setNewSessionDescription] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await getSessions();
        setSessions(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load study sessions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [toast]);

  const handleCreateSession = async () => {
    if (!newSessionTitle.trim()) {
      toast({
        title: "Error",
        description: "Session title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const newSession = await createSession({
        title: newSessionTitle,
        description: newSessionDescription,
      });
      setSessions([...sessions, newSession]);
      setNewSessionTitle("");
      setNewSessionDescription("");
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await deleteSession(id);
      setSessions(sessions.filter(session => session.id !== id));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Study Sessions</h1>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-bg">
                Create New Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Study Session</DialogTitle>
                <DialogDescription>
                  Create a new study session to organize your learning materials.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Session Title</Label>
                  <Input 
                    id="title"
                    placeholder="Enter a title for your study session"
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea 
                    id="description"
                    placeholder="Describe what you'll be studying"
                    value={newSessionDescription}
                    onChange={(e) => setNewSessionDescription(e.target.value)}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="gradient-bg" onClick={handleCreateSession}>
                  Create Session
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border shadow-sm animate-pulse">
                <CardHeader className="bg-gray-100 h-16"></CardHeader>
                <CardContent className="pt-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
                <CardFooter className="h-10 bg-gray-50"></CardFooter>
              </Card>
            ))}
          </div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Card 
                key={session.id} 
                className="border shadow-md hover:shadow-lg transition-shadow cursor-pointer card-hover"
                onClick={() => navigate(`/session/${session.id}`)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-start">
                    <span className="text-xl">{session.title}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {session.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Created: {formatDate(session.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Updated: {formatDate(session.updatedAt)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t flex justify-between">
                  <div className="flex gap-2 text-sm">
                    <span className="text-purple-600">{session.files.length} Files</span>
                    <span className="text-purple-600">{session.flashcards.length} Flashcards</span>
                    <span className="text-purple-600">{session.quizzes.length} Quizzes</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 gradient-bg rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                <path d="M2 17L12 22L22 17V7L12 12L2 7V17Z" fill="currentColor" fillOpacity="0.8" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">No Study Sessions Yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first study session to upload PDFs and start generating flashcards, quizzes, and more.
            </p>
            <Button
              className="gradient-bg"
              onClick={() => setDialogOpen(true)}
            >
              Create Your First Session
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
