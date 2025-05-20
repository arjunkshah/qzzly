import { StudySession, FileItem, Flashcard, Quiz, ChatMessage } from "@/types/session";
import { toast } from "@/hooks/use-toast";
import { generateWithGemini, generateFlashcards, generateQuiz } from "./geminiService";

// Mock data for study sessions
const mockSessions: StudySession[] = [
  {
    id: "1",
    title: "Biology 101",
    description: "Introduction to Cell Biology and Genetics",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    files: [
      {
        id: "f1",
        name: "cell_structure.pdf",
        url: "#",
        type: "application/pdf",
        uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ],
    flashcards: [
      {
        id: "fc1",
        front: "What is a cell?",
        back: "A cell is the basic structural and functional unit of all living organisms.",
        mastered: false,
      },
      {
        id: "fc2",
        front: "What is DNA?",
        back: "DNA (deoxyribonucleic acid) is a molecule that carries genetic information in all living organisms.",
        mastered: true,
      },
      {
        id: "fc3",
        front: "What is mitosis?",
        back: "Mitosis is a process of cell division that results in two identical daughter cells.",
        mastered: false,
      }
    ],
    quizzes: [
      {
        id: "q1",
        title: "Cell Structure Quiz",
        questions: [
          {
            id: "q1-1",
            text: "Which organelle is known as the powerhouse of the cell?",
            options: ["Nucleus", "Mitochondria", "Endoplasmic Reticulum", "Golgi Apparatus"],
            correctAnswer: 1,
            explanation: "Mitochondria are responsible for producing energy in the form of ATP through cellular respiration."
          },
          {
            id: "q1-2",
            text: "What is the function of the cell membrane?",
            options: ["Store genetic information", "Protein synthesis", "Control what enters and exits the cell", "Energy production"],
            correctAnswer: 2,
            explanation: "The cell membrane is a semipermeable barrier that controls what substances can enter and exit the cell."
          }
        ]
      }
    ]
  },
  {
    id: "2",
    title: "Computer Science Fundamentals",
    description: "Basic algorithms and data structures",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    files: [
      {
        id: "f2",
        name: "algorithms_intro.pdf",
        url: "#",
        type: "application/pdf",
        uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ],
    flashcards: [
      {
        id: "fc4",
        front: "What is an algorithm?",
        back: "A step-by-step procedure for solving a problem or accomplishing a task.",
        mastered: false,
      },
      {
        id: "fc5",
        front: "What is Big O notation?",
        back: "A mathematical notation that describes the limiting behavior of a function when the argument tends towards a particular value or infinity.",
        mastered: false,
      }
    ],
    quizzes: [
      {
        id: "q2",
        title: "Algorithm Complexity",
        questions: [
          {
            id: "q2-1",
            text: "What is the time complexity of binary search?",
            options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
            correctAnswer: 2,
            explanation: "Binary search has O(log n) time complexity because it divides the search space in half with each step."
          }
        ]
      }
    ]
  }
];

// Mock chat messages
const mockChatMessages: Record<string, ChatMessage[]> = {
  "1": [
    {
      id: "cm1",
      role: "assistant",
      content: "Hi there! I'm your study assistant. How can I help you with your Biology studies today?",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ],
  "2": [
    {
      id: "cm2",
      role: "assistant",
      content: "Hello! I'm here to help you with Computer Science. What would you like to learn about algorithms or data structures?",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ]
};

// Local storage keys
const SESSIONS_KEY = 'quiz_io_sessions';
const MESSAGES_KEY = 'quiz_io_messages';

// Initialize data from local storage or use mock data
const initializeData = () => {
  const storedSessions = localStorage.getItem(SESSIONS_KEY);
  const storedMessages = localStorage.getItem(MESSAGES_KEY);
  
  if (!storedSessions) {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(mockSessions));
  }
  
  if (!storedMessages) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(mockChatMessages));
  }
};

// Get all sessions
export const getSessions = (): Promise<StudySession[]> => {
  initializeData();
  return new Promise((resolve) => {
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
    setTimeout(() => resolve(sessions), 300); // Simulate API delay
  });
};

// Get a single session
export const getSessionById = (id: string): Promise<StudySession | null> => {
  initializeData();
  return new Promise((resolve) => {
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
    const session = sessions.find((s: StudySession) => s.id === id) || null;
    setTimeout(() => resolve(session), 300); // Simulate API delay
  });
};

// Create a new session
export const createSession = (sessionData: Partial<StudySession>): Promise<StudySession> => {
  initializeData();
  return new Promise((resolve) => {
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
    const newSession: StudySession = {
      id: `session_${Date.now()}`,
      title: sessionData.title || 'New Study Session',
      description: sessionData.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      files: sessionData.files || [],
      flashcards: sessionData.flashcards || [],
      quizzes: sessionData.quizzes || []
    };
    
    sessions.push(newSession);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    
    // Initialize empty chat for this session
    const messages = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '{}');
    messages[newSession.id] = [
      {
        id: `welcome_${newSession.id}`,
        role: 'assistant',
        content: `Welcome to your new study session "${newSession.title}"! I'm here to help you learn. You can upload PDFs, create flashcards, or ask me questions.`,
        timestamp: new Date().toISOString()
      }
    ];
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    
    toast({
      title: "Session created",
      description: `"${newSession.title}" has been created successfully.`
    });
    
    setTimeout(() => resolve(newSession), 300); // Simulate API delay
  });
};

// Delete a session
export const deleteSession = (id: string): Promise<void> => {
  return new Promise((resolve) => {
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
    const filteredSessions = sessions.filter((s: StudySession) => s.id !== id);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(filteredSessions));
    
    // Delete associated chat messages
    const messages = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '{}');
    delete messages[id];
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    
    toast({
      title: "Session deleted",
      description: "The study session has been deleted."
    });
    
    setTimeout(() => resolve(), 300); // Simulate API delay
  });
};

// Update a session
export const updateSession = (id: string, updates: Partial<StudySession>): Promise<StudySession> => {
  return new Promise((resolve, reject) => {
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
    const index = sessions.findIndex((s: StudySession) => s.id === id);
    
    if (index === -1) {
      toast({
        title: "Error",
        description: "Session not found",
        variant: "destructive"
      });
      reject(new Error("Session not found"));
      return;
    }
    
    const updatedSession = {
      ...sessions[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    sessions[index] = updatedSession;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    
    toast({
      title: "Session updated",
      description: `"${updatedSession.title}" has been updated.`
    });
    
    setTimeout(() => resolve(updatedSession), 300); // Simulate API delay
  });
};

// Add a file to a session
export const addFileToSession = (sessionId: string, file: FileItem): Promise<StudySession> => {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await getSessionById(sessionId);
      
      if (!session) {
        reject(new Error("Session not found"));
        return;
      }
      
      const updatedFiles = [...session.files, file];
      const updatedSession = await updateSession(sessionId, { files: updatedFiles });
      resolve(updatedSession);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Get chat messages for a session
export const getChatMessages = (sessionId: string): Promise<ChatMessage[]> => {
  initializeData();
  return new Promise((resolve) => {
    const allMessages = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '{}');
    const sessionMessages = allMessages[sessionId] || [];
    setTimeout(() => resolve(sessionMessages), 300); // Simulate API delay
  });
};

// Add a message to the chat
export const addChatMessage = (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> => {
  return new Promise((resolve) => {
    const allMessages = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '{}');
    const sessionMessages = allMessages[sessionId] || [];
    
    const newMessage = {
      ...message,
      id: `msg_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    
    allMessages[sessionId] = [...sessionMessages, newMessage];
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMessages));
    
    setTimeout(() => resolve(newMessage), 300); // Simulate API delay
  });
};

// Add a flashcard to a session
export const addFlashcard = (sessionId: string, flashcard: Omit<Flashcard, 'id'>): Promise<StudySession> => {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await getSessionById(sessionId);
      
      if (!session) {
        reject(new Error("Session not found"));
        return;
      }
      
      const newFlashcard = {
        ...flashcard,
        id: `fc_${Date.now()}`,
        mastered: false
      };
      
      const updatedFlashcards = [...session.flashcards, newFlashcard];
      const updatedSession = await updateSession(sessionId, { flashcards: updatedFlashcards });
      resolve(updatedSession);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Toggle flashcard mastered status
export const toggleFlashcardMastery = (sessionId: string, flashcardId: string): Promise<StudySession> => {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await getSessionById(sessionId);
      
      if (!session) {
        reject(new Error("Session not found"));
        return;
      }
      
      const updatedFlashcards = session.flashcards.map(card => 
        card.id === flashcardId ? { ...card, mastered: !card.mastered } : card
      );
      
      const updatedSession = await updateSession(sessionId, { flashcards: updatedFlashcards });
      resolve(updatedSession);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Add a quiz to a session
export const addQuiz = (sessionId: string, quiz: Omit<Quiz, 'id'>): Promise<StudySession> => {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await getSessionById(sessionId);
      
      if (!session) {
        reject(new Error("Session not found"));
        return;
      }
      
      const newQuiz = {
        ...quiz,
        id: `quiz_${Date.now()}`
      };
      
      const updatedQuizzes = [...session.quizzes, newQuiz];
      const updatedSession = await updateSession(sessionId, { quizzes: updatedQuizzes });
      resolve(updatedSession);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Use Gemini API to generate content
export const generateContentWithGemini = async (
  prompt: string, 
  type: 'flashcards' | 'quiz' | 'chat',
  sessionId?: string
): Promise<any> => {
  console.log(`Generating ${type} with prompt: ${prompt}`);
  
  try {
    if (type === 'flashcards') {
      const flashcards = await generateFlashcards(prompt);
      return flashcards;
    } else if (type === 'quiz') {
      const quiz = await generateQuiz(prompt);
      return quiz;
    } else {
      // For chat, use the general text generation
      const response = await generateWithGemini(prompt, {
        temperature: 0.7,
        maxOutputTokens: 1000
      });
      return response;
    }
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    return type === 'chat' 
      ? "I'm sorry, I encountered an error processing your request. Please try again."
      : [];
  }
};
