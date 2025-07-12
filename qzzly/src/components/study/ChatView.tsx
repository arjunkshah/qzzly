import React, { useState, useEffect, useRef } from 'react';
import { StudyFile, ChatMessage } from '../../types/session';
import ViewContainer from '../ui/ViewContainer';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import { IconMic, IconMessageSquare } from '../../lib/constants';
import { createChat } from '../../services/geminiService';

interface ChatViewProps {
  files: StudyFile[];
  chatMessages: ChatMessage[];
  sessionId: string;
}

const ChatView: React.FC<ChatViewProps> = ({ files, chatMessages, sessionId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chat, setChat] = useState<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setChat(createChat(files));
  }, [files]);

  useEffect(() => {
    setMessages(chatMessages || []);
  }, [chatMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chat) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    try {
      const aiResponse = await chat.sendMessage(inputMessage);
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.text,
        timestamp: new Date().toISOString()
      };
        setMessages(prev => [...prev, response]);
    } catch (error: unknown) {
      const err = error as Error;
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: err?.message || 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
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
    <ViewContainer title="Chat with your Documents" isLoading={false} error={null}>
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
                {/* Remove timestamp rendering */}
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