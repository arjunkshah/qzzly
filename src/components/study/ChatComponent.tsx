import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage, FileItem } from "@/types/session";
import { getChatMessages, addChatMessage, addFileToSession, generateContentWithGemini } from "@/services/sessionService";
import { MessageSquare, Send, Upload, Plus } from "lucide-react";

interface ChatComponentProps {
  sessionId: string;
  files: FileItem[];
  onFileUploaded: (file: FileItem) => void;
}

export function ChatComponent({ sessionId, files, onFileUploaded }: ChatComponentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [responding, setResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const chatMessages = await getChatMessages(sessionId);
        setMessages(chatMessages);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [sessionId, toast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessageContent = inputMessage;
    setInputMessage("");
    
    try {
      // Add user message to the chat
      const userMessage = await addChatMessage(sessionId, {
        role: "user",
        content: userMessageContent,
      });
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setResponding(true);
      
      try {
        // Generate AI response
        const response = await generateContentWithGemini(userMessageContent, "chat", sessionId);
        
        // Add AI response to the chat
        const aiMessage = await addChatMessage(sessionId, {
          role: "assistant",
          content: response,
        });
        
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error("Error generating response:", error);
        // Add error message to chat
        const errorMessage = await addChatMessage(sessionId, {
          role: "assistant",
          content: "I'm sorry, I encountered an error processing your request. Please try again.",
        });
        
        setMessages(prev => [...prev, errorMessage]);
        
        toast({
          title: "Error",
          description: "Failed to generate a response",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setResponding(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    const uploadedFileNames: string[] = [];
    
    try {
      // Process each file
      for (const file of files) {
        if (file.type !== "application/pdf") {
          toast({
            title: "Error",
            description: "Only PDF files are supported",
            variant: "destructive",
          });
          continue;
        }
        
        // In a real app, we would upload to a storage service
        // Here we're just simulating the upload
        const newFile: FileItem = {
          id: `file_${Date.now()}_${file.name}`,
          name: file.name,
          url: URL.createObjectURL(file), // In real app, this would be the cloud storage URL
          type: file.type,
          uploadedAt: new Date().toISOString()
        };
        
        await addFileToSession(sessionId, newFile);
        onFileUploaded(newFile);
        uploadedFileNames.push(file.name);
      }
      
      if (uploadedFileNames.length > 0) {
        // Add a message about the files
        const fileMessage = uploadedFileNames.length === 1 
          ? `I've uploaded a file: ${uploadedFileNames[0]}`
          : `I've uploaded ${uploadedFileNames.length} files: ${uploadedFileNames.join(", ")}`;
        
        const userMessage = await addChatMessage(sessionId, {
          role: "user",
          content: fileMessage,
        });
        
        setMessages(prevMessages => [...prevMessages, userMessage]);
        
        // Get AI response about the files
        setResponding(true);
        
        try {
          const promptAboutFiles = `I've uploaded ${uploadedFileNames.length > 1 ? 'new PDF files' : 'a new PDF file'} called ${uploadedFileNames.join(", ")}. Can you help me use ${uploadedFileNames.length > 1 ? 'these' : 'this'} for studying?`;
          
          const response = await generateContentWithGemini(promptAboutFiles, "chat", sessionId);
          
          const aiMessage = await addChatMessage(sessionId, {
            role: "assistant",
            content: response,
          });
          
          setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
          console.error("Error generating response about files:", error);
          // Add error message to chat
          const errorMessage = await addChatMessage(sessionId, {
            role: "assistant",
            content: "I'm sorry, I encountered an error processing your uploaded files. Please try asking a specific question about the content.",
          });
          
          setMessages(prev => [...prev, errorMessage]);
        }
        
        toast({
          title: "Files uploaded",
          description: `${uploadedFileNames.length} file(s) have been uploaded successfully`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file(s)",
        variant: "destructive",
      });
    } finally {
      setResponding(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">AI Study Assistant</h2>
          <p className="text-gray-600">
            Chat with our AI to get help with your study materials
          </p>
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf"
            multiple
            onChange={handleFileUpload}
          />
          <Button 
            variant="outline"
            className="flex items-center gap-2 border-purple-300 text-purple-600 hover:bg-purple-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Upload PDFs
          </Button>
        </div>
      </div>
      
      <Card className="border mb-4">
        <div className="h-[500px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <MessageSquare className="h-12 w-12 text-purple-300 mb-2" />
                <h3 className="text-lg font-medium text-gray-700">Your AI Study Assistant</h3>
                <p className="text-gray-500 mt-2 max-w-sm">
                  Ask questions about your study materials or upload PDFs to get help with your studies.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-purple-600 text-white rounded-tr-none' 
                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p 
                      className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            {responding && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg rounded-tl-none max-w-[80%]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question about your study materials..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !responding) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={responding}
              />
              <Button 
                className="gradient-bg"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || responding}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      <div className="text-sm text-gray-500 text-center">
        <p>The AI can help you understand concepts, generate study materials, and answer questions about your uploaded PDFs.</p>
      </div>
    </div>
  );
}
