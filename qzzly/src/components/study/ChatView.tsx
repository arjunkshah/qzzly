import React, { useState, useEffect, useRef } from 'react';
import { StudyFile, ChatMessage } from '../../types/session';
import ViewContainer from '../ui/ViewContainer';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import { IconMic, IconMessageSquare } from '../../lib/constants';
import { createChat } from '../../services/geminiService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchChatMessages, sendChatMessage } from '../../services/supabaseChat';
import { useAuth } from '../../contexts/AuthContext';

interface ChatViewProps {
  files: StudyFile[];
  sessionId: string;
}

const ChatView: React.FC<ChatViewProps> = ({ files, sessionId }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chat, setChat] = useState<any>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch chat messages from Supabase
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['chatMessages', sessionId],
    queryFn: () => fetchChatMessages(sessionId),
    enabled: !!sessionId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { role: 'user' | 'assistant'; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      return await sendChatMessage(sessionId, user.id, data.role, data.content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
    },
  });

  useEffect(() => {
    setChat(createChat(files));
  }, [files]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chat) return;
    setIsLoading(true);
    // Store user message in Supabase
    sendMessageMutation.mutate({ role: 'user', content: inputMessage });
    setInputMessage('');
    try {
      const aiResponse = await chat.sendMessage(inputMessage);
      // Store assistant message in Supabase
      sendMessageMutation.mutate({ role: 'assistant', content: aiResponse.text });
    } catch (error: unknown) {
      const err = error as Error;
      sendMessageMutation.mutate({ role: 'assistant', content: err?.message || 'Sorry, I encountered an error while processing your request. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <ViewContainer title="Chat with your Documents" isLoading={messagesLoading} error={null}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-6 mb-4 px-2">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <IconMessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Start a conversation about your documents!</p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
            >
              <div className={`rounded-2xl px-6 py-4 max-w-[70%] ${message.role === 'user' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white self-end' : 'bg-gray-100 text-gray-900 self-start'} shadow-md`}>
                <div className="text-base whitespace-pre-line">
                    <MarkdownRenderer content={message.content} />
                  </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start w-full">
              <div className="rounded-2xl px-6 py-4 max-w-[70%] bg-gray-100 text-gray-900 shadow-md">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex space-x-2 mt-4 px-2 pb-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your documents..."
            disabled={isLoading}
            className="flex-1 text-lg py-3"
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !inputMessage.trim()} className="px-6 py-3 text-lg">Send</Button>
        </div>
      </div>
    </ViewContainer>
  );
};

export default ChatView; 