import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage, FileItem } from "@/types/session";
// TODO: Implement SessionService.getChatMessages, addChatMessage, addFileToSession
import { SessionService } from "@/services/sessionService";
import { generateLongAnswer } from "@/services/openaiService";
import { MessageSquare, Send, Upload, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  // const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        // const chatMessages = await SessionService.getChatMessages(sessionId);
        const chatMessages = [];
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
      // const userMessage = await SessionService.addChatMessage(sessionId, {
      const userMessage = { id: Date.now().toString(), role: 'user' as const, content: userMessageContent, timestamp: new Date().toISOString() };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setResponding(true);
      
      try {
        // Generate AI response
        const response = await generateLongAnswer(userMessageContent, "medium", files, sessionId);
        
        // Add AI response to the chat
        // const aiMessage = await SessionService.addChatMessage(sessionId, {
        const aiMessage = { id: (Date.now() + 1).toString(), role: 'assistant' as const, content: response, timestamp: new Date().toISOString() };
        
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error("Error generating response:", error);
        // Add error message to chat
        // const errorMessage = await SessionService.addChatMessage(sessionId, {
        const errorMessage = { id: (Date.now() + 2).toString(), role: 'assistant' as const, content: "I'm sorry, I encountered an error processing your request. Please try again.", timestamp: new Date().toISOString() };
        
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
    
    const selectedFiles = Array.from(e.target.files);
    const uploadedFileNames: string[] = [];
    
    try {
      // Process each file
      for (const file of selectedFiles) {
        if (file.type !== "application/pdf") {
          toast({
            title: "Error",
            description: "Only PDF files are supported",
            variant: "destructive",
          });
          continue;
        }
        
        // Read the file content
        const fileContent = await file.arrayBuffer();
        const base64Content = btoa(
          new Uint8Array(fileContent)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        
        // Create file object with content
        const newFile: Omit<FileItem, 'id'> = {
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type,
          uploadedAt: new Date().toISOString(),
          content: base64Content // Add the file content
        };
        
        // const savedFile = await SessionService.addFileToSession(sessionId, newFile);
        const savedFile = { ...newFile, id: Date.now().toString() };
        onFileUploaded(savedFile);
        uploadedFileNames.push(file.name);
      }
      
      if (uploadedFileNames.length > 0) {
        // Add a message about the files
        const fileMessage = uploadedFileNames.length === 1 
          ? `I've uploaded a file: ${uploadedFileNames[0]}`
          : `I've uploaded ${uploadedFileNames.length} files: ${uploadedFileNames.join(", ")}`;
        
        // const userMessage = await SessionService.addChatMessage(sessionId, {
        const userMessage = { id: (Date.now() + 3).toString(), role: 'user' as const, content: fileMessage, timestamp: new Date().toISOString() };
        
        setMessages(prevMessages => [...prevMessages, userMessage]);
        
        // Notify user that files are being processed in the background
        setResponding(true);
        
        try {
          // Just acknowledge the file was uploaded without explicitly asking for ingestion
          const response = await generateLongAnswer(
            `I've uploaded ${uploadedFileNames.length > 1 ? 'some files' : 'a file'} to this session.`,
            "medium",
            files,
            sessionId
          );
          
          // const aiMessage = await SessionService.addChatMessage(sessionId, {
          const aiMessage = { id: (Date.now() + 4).toString(), role: 'assistant' as const, content: response, timestamp: new Date().toISOString() };
          
          setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
          console.error("Error generating response about files:", error);
          // Add error message to chat
          // const errorMessage = await SessionService.addChatMessage(sessionId, {
          const errorMessage = { id: (Date.now() + 5).toString(), role: 'assistant' as const, content: "I've received your files and am processing them in the background. You can ask me questions about them shortly.", timestamp: new Date().toISOString() };
          
          setMessages(prev => [...prev, errorMessage]);
        }
        
        toast({
          title: "Files uploaded",
          description: `${uploadedFileNames.length} file(s) have been uploaded and are being processed`
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
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">Chat Assistant</h2>
          {files.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{files.length} file{files.length > 1 ? 's' : ''} available</span>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload PDF
        </Button>
      </div>
      
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf"
            multiple
            onChange={handleFileUpload}
          />
      
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
