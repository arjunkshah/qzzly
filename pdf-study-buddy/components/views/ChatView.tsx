
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createChat } from '../../services/geminiService';
import ViewContainer from './ViewContainer';
import { Chat, GenerateContentResponse, Part } from '@google/genai';
import { StudyFile, ChatMessage } from '../../types';
import MarkdownRenderer from '../MarkdownRenderer';
import { IconMic } from '../../constants';

const SuggestedQuestionButton: React.FC<{ question: string; onClick: (q: string) => void }> = ({ question, onClick }) => (
    <button
        onClick={() => onClick(question)}
        className="text-sm text-left w-full p-2 rounded-lg bg-primary-100/50 dark:bg-primary-900/50 hover:bg-primary-100 dark:hover:bg-primary-900 text-primary-700 dark:text-primary-200 transition-colors"
    >
        {question}
    </button>
);


const ChatView: React.FC<{ files: StudyFile[] }> = ({ files }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(() => new Set(files.map(f => f.id)));
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null); // Using 'any' for SpeechRecognition to avoid browser-specific type issues

  useEffect(() => {
    // Setup Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);
  
  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (files.length > 0) {
      setChat(createChat(files));
      setMessages([{
        sender: 'ai',
        text: "I've read your document(s). Ask me anything, or just say hello!"
      }]);
      setSelectedFileIds(new Set(files.map(f => f.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const handleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(fileId)) {
            newSet.delete(fileId);
        } else {
            newSet.add(fileId);
        }
        return newSet;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || !chat || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: messageText };
    setMessages(prev => [...prev, userMessage]);
    if (messageText === userInput) setUserInput('');
    setIsLoading(true);

    try {
        const contextFiles = files.filter(f => selectedFileIds.has(f.id));
        const parts: Part[] = [];
        let textContent = `Using the context from the files: ${contextFiles.map(f => f.name).join(', ')}, answer the following question: ${messageText}`;
        
        const imageFiles = contextFiles.filter(f => f.type.startsWith('image/'));
        imageFiles.forEach(file => {
            parts.push({ inlineData: { mimeType: file.type, data: file.content }});
        });
        
        parts.unshift({ text: textContent });

        const response: GenerateContentResponse = await chat.sendMessage({ message: parts });
        
        // Parse response for deep dive questions
        const responseText = response.text;
        const deepDiveIdentifier = "DEEP DIVE";
        const partsOfResponse = responseText.split(deepDiveIdentifier);
        const mainText = partsOfResponse[0].trim();
        let suggestedQuestions: string[] = [];

        if (partsOfResponse.length > 1) {
            const suggestionsText = partsOfResponse[1];
            suggestedQuestions = suggestionsText.match(/^\s*-\s*(.*)/gm)?.map(q => q.replace(/^\s*-\s*/, '').trim()) || [];
        }

        const aiMessage: ChatMessage = { sender: 'ai', text: mainText, suggestedQuestions };
        setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = { sender: 'ai', text: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [chat, isLoading, files, selectedFileIds, userInput]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(userInput);
  }

  const handleSuggestedQuestionClick = (question: string) => {
    sendMessage(question);
  }

  return (
    <ViewContainer title="Chat with your Documents" isLoading={false} error={null}>
      <div className="flex flex-col h-full">
        <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
          {messages.map((msg, index) => (
            <div key={index}>
                <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-md lg:max-w-xl p-3 rounded-2xl shadow ${
                      msg.sender === 'user'
                        ? 'bg-primary-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                    }`}
                  >
                    <MarkdownRenderer content={msg.text} />
                  </div>
                </div>
                {msg.sender === 'ai' && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="flex justify-start">
                        <div className="max-w-md lg:max-w-xl w-full mt-2 pl-2">
                             <h4 className="text-sm font-semibold mb-1 text-primary-800 dark:text-primary-300">Deep Dive:</h4>
                             <div className="space-y-1">
                                {msg.suggestedQuestions.map((q, i) => (
                                    <SuggestedQuestionButton key={i} question={q} onClick={handleSuggestedQuestionClick} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="max-w-md p-3 rounded-2xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="mt-4 border-t dark:border-gray-700 pt-4">
            <p className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Select files to include in chat context:</p>
            <div className="flex flex-wrap gap-2 mb-4">
                {files.map(file => (
                    <button 
                        key={file.id} 
                        onClick={() => handleFileSelection(file.id)}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${selectedFileIds.has(file.id) ? 'bg-primary-600 text-white border-primary-600' : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                    >
                        {file.name}
                    </button>
                ))}
            </div>
            <form onSubmit={handleFormSubmit} className="flex items-center space-x-2">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask a question..."}
                    className="flex-grow p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500 transition dark:bg-gray-800"
                    disabled={isLoading || isListening}
                />
                {recognitionRef.current && (
                  <button type="button" onClick={handleMicClick} className={`p-3 rounded-lg transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                    <IconMic className="w-6 h-6" />
                  </button>
                )}
                <button
                    type="submit"
                    disabled={isLoading || !userInput.trim() || selectedFileIds.size === 0}
                    className="bg-primary-600 text-white p-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Send
                </button>
            </form>
        </div>
      </div>
    </ViewContainer>
  );
};

export default ChatView;