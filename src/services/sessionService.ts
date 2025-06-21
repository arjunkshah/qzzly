import { StudySession, FileItem, Flashcard, Quiz, ChatMessage, StudyMaterial } from "@/types/session";
import { toast } from "@/hooks/use-toast";
import { 
  generateWithOpenAI, 
  generateFlashcards, 
  generateQuiz, 
  generateStudyMaterial, 
  generateLongAnswer,
  addFileToSessionContext,
  ingestAndSummarizeFile,
  ingestSessionFiles
} from "./openaiService";

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
  initializeData();
  return new Promise((resolve) => {
    try {
      const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
      const sessionIndex = sessions.findIndex((s: StudySession) => s.id === sessionId);
      
      if (sessionIndex === -1) {
        throw new Error('Session not found');
      }

      // Ensure file has required fields
      if (!file.id || !file.name || !file.type) {
        throw new Error('Invalid file data');
      }
      
      // Create a file object without the content for localStorage
      const fileForStorage = {
        ...file,
        content: undefined // Remove content from localStorage storage
      };
      
      // Add file to session
      sessions[sessionIndex].files.push(fileForStorage);
      sessions[sessionIndex].updatedAt = new Date().toISOString();
      
      // Save to localStorage
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      
      // Add file to session context for OpenAI with content
      addFileToSessionContext(sessionId, file);
      
      // Start file ingestion in the background
      ingestAndSummarizeFile(file, sessionId)
        .then(result => {
          // Store the summary and topics
          const fileSummaries = JSON.parse(localStorage.getItem('file_summaries') || '{}');
          if (!fileSummaries[sessionId]) {
            fileSummaries[sessionId] = {};
          }
          fileSummaries[sessionId][file.id] = result;
          localStorage.setItem('file_summaries', JSON.stringify(fileSummaries));
          
          console.log(`Successfully processed file ${file.name}`);
        })
        .catch(error => {
          console.error('Error ingesting file:', error);
          toast({
            title: "Error",
            description: `Failed to process ${file.name}. Please try uploading again.`,
            variant: "destructive"
          });
        });
      
      setTimeout(() => resolve(sessions[sessionIndex]), 300); // Simulate API delay
        } catch (error) {
      console.error('Error in addFileToSession:', error);
      toast({
        title: "Error",
        description: "Failed to add file. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  });
};

// Remove a file from a session
export const removeFileFromSession = (sessionId: string, fileId: string): Promise<StudySession> => {
  initializeData();
  return new Promise((resolve, reject) => {
    try {
      const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
      const sessionIndex = sessions.findIndex((s: StudySession) => s.id === sessionId);
      
      if (sessionIndex === -1) {
        reject(new Error('Session not found'));
        return;
      }
      
      // Remove file from session
      sessions[sessionIndex].files = sessions[sessionIndex].files.filter((file: FileItem) => file.id !== fileId);
      sessions[sessionIndex].updatedAt = new Date().toISOString();
      
      // Save to localStorage
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      
      // Remove file summary if it exists
      const fileSummaries = JSON.parse(localStorage.getItem('file_summaries') || '{}');
      if (fileSummaries[sessionId] && fileSummaries[sessionId][fileId]) {
        delete fileSummaries[sessionId][fileId];
        localStorage.setItem('file_summaries', JSON.stringify(fileSummaries));
      }
      
      setTimeout(() => resolve(sessions[sessionIndex]), 300); // Simulate API delay
    } catch (error) {
      console.error('Error in removeFileFromSession:', error);
      toast({
        title: "Error",
        description: "Failed to remove file. Please try again.",
        variant: "destructive"
      });
      reject(error);
    }
  });
};

// Get file summaries for a session
export const getFileSummaries = (sessionId: string): Promise<Record<string, any>> => {
  return new Promise((resolve) => {
    const fileSummaries = JSON.parse(localStorage.getItem('file_summaries') || '{}');
    const sessionSummaries = fileSummaries[sessionId] || {};
    setTimeout(() => resolve(sessionSummaries), 300); // Simulate API delay
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

// Add multiple flashcards to a session at once (batch operation)
export const addFlashcards = (sessionId: string, flashcards: Omit<Flashcard, 'id'>[]): Promise<StudySession> => {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await getSessionById(sessionId);
      
      if (!session) {
        reject(new Error("Session not found"));
        return;
      }
      
      // Create new flashcards with unique IDs
      const newFlashcards = flashcards.map((flashcard, index) => ({
        ...flashcard,
        id: `fc_${Date.now()}_${index}`,
        mastered: false
      }));
      
      const updatedFlashcards = [...session.flashcards, ...newFlashcards];
      const updatedSession = await updateSession(sessionId, { flashcards: updatedFlashcards });
      resolve(updatedSession);
      
    } catch (error) {
      reject(error);
    }
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

// Update a flashcard
export const updateFlashcard = (sessionId: string, flashcardId: string, updates: Partial<Flashcard>): Promise<StudySession> => {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await getSessionById(sessionId);
      
      if (!session) {
        reject(new Error("Session not found"));
        return;
      }
      
      const updatedFlashcards = session.flashcards.map(card => 
        card.id === flashcardId ? { ...card, ...updates } : card
      );
      
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

// Get file content from storage
const getFileContent = (fileId: string): string | null => {
  const fileContents = JSON.parse(localStorage.getItem('pdf_contents') || '{}');
  return fileContents[fileId] || null;
};

// Add study material to a session
export const addStudyMaterial = (sessionId: string, material: Omit<StudyMaterial, 'id'>): Promise<StudySession> => {
  return new Promise(async (resolve, reject) => {
    try {
      const session = await getSessionById(sessionId);
      
      if (!session) {
        reject(new Error("Session not found"));
        return;
      }
      
      const newMaterial = {
        ...material,
        id: `material_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      
      // Initialize studyMaterials array if it doesn't exist
      const studyMaterials = session.studyMaterials || [];
      const updatedMaterials = [...studyMaterials, newMaterial];
      
      const updatedSession = await updateSession(sessionId, { studyMaterials: updatedMaterials });
      resolve(updatedSession);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Generate flashcards using OpenAI API
export const generateFlashcardsWithOpenAI = async (
  sessionId: string,
  topic: string,
  count: number = 5,
  complexity: string = "medium"
): Promise<Flashcard[]> => {
  try {
    // Get session files
    const session = await getSessionById(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    // Generate flashcards using session context
    const generatedFlashcards = await generateFlashcards(topic, count, complexity, session.files, sessionId);
    
    // Save each flashcard to the session
    const savedFlashcards: Flashcard[] = [];
    
    // Use Promise.all to add all flashcards concurrently and collect results
    await Promise.all(generatedFlashcards.map(async (card) => {
      const flashcard: Omit<Flashcard, 'id'> = {
        front: card.front,
        back: card.back,
        mastered: false
      };
      
      try {
        // Add the flashcard to the session
        const newCard = {
          ...flashcard,
          id: `fc_${Date.now()}_${savedFlashcards.length}`, // Ensure unique ID
          mastered: false
        };
        
        // Add to the array of saved flashcards
        savedFlashcards.push(newCard);
      } catch (error) {
        console.error("Error adding flashcard:", error);
      }
    }));
    
    // Now batch update the session with all flashcards at once
    if (savedFlashcards.length > 0) {
      const updatedFlashcards = [...session.flashcards, ...savedFlashcards];
      await updateSession(sessionId, { flashcards: updatedFlashcards });
    }
    
    return savedFlashcards;
  } catch (error) {
    console.error("Error generating flashcards:", error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to generate flashcards",
      variant: "destructive"
    });
    throw error;
  }
};

// Generate study material using OpenAI API
export const generateStudyMaterialWithOpenAI = async (
  sessionId: string,
  topic: string,
  format: 'notes' | 'outline' | 'summary' = 'notes',
  complexity: string = "medium"
): Promise<StudyMaterial> => {
  try {
    // Get session files
    const session = await getSessionById(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    // Generate study material content with session context
    const content = await generateStudyMaterial(topic, format, complexity, session.files, sessionId);
    
    // Create new study material with unique ID
    const materialId = `material_${Date.now()}`;
    const newMaterial: StudyMaterial = {
      id: materialId,
      title: topic,
      content,
      format,
      complexity,
      createdAt: new Date().toISOString()
    };
    
    // Add to session directly
    const updatedSession = await updateSession(sessionId, { 
      studyMaterials: [...(session.studyMaterials || []), newMaterial] 
    });
    
    // Return the newly created material
    return newMaterial;
  } catch (error) {
    console.error("Error generating study material:", error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to generate study material",
      variant: "destructive"
    });
    throw error;
  }
};

// Generate long answer using OpenAI API
export const generateLongAnswerWithOpenAI = async (
  sessionId: string,
  question: string,
  complexity: string = "medium"
): Promise<string> => {
  try {
    // Get session files
    const session = await getSessionById(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    // Generate long answer with session context
    const answer = await generateLongAnswer(question, complexity, session.files, sessionId);
    return answer;
  } catch (error) {
    console.error("Error generating long answer:", error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to generate answer",
      variant: "destructive"
    });
    throw error;
  }
};

// Use OpenAI API to generate content
export const generateContentWithOpenAI = async (
  prompt: string, 
  type: 'flashcards' | 'quiz' | 'chat' | 'study' | 'longAnswer',
  sessionId?: string,
  options: any = {}
): Promise<any> => {
  console.log(`Generating ${type} with prompt: ${prompt}`);
  
  try {
    // Get session files if sessionId is provided
    let sessionFiles = [];
    if (sessionId) {
      const session = await getSessionById(sessionId);
      if (session?.files) {
        sessionFiles = session.files;
      }
    }
    
    // Build context about available files
    let fileContext = '';
    if (sessionFiles.length > 0) {
      const fileInfo = sessionFiles
        .map(file => `${file.name} (${file.type})`)
        .join(', ');
      
      fileContext = `\n\nFiles in this study session: ${fileInfo}`;
    }
    
    // Import Gemini service
    const gemini = await import('./geminiService');
    
    switch (type) {
      case 'flashcards':
        return await gemini.generateFlashcards(
          prompt,
          options.count || 5,
          options.complexity || 'medium',
          options.files,
          sessionId
        );
      
      case 'quiz':
        return await gemini.generateQuiz(
        prompt + fileContext, 
          options.questionCount || 7,
          options.difficulty || "medium",
          options.topic || "",
          options.includeExplanations !== false,
        sessionFiles,
        sessionId
      );
      
      case 'study':
        return await gemini.generateStudyMaterial(
          prompt,
          options.format || 'notes',
          options.complexity || 'medium',
          sessionFiles,
          sessionId
        );
      
      case 'longAnswer':
        return await gemini.generateLongAnswer(
          prompt,
          options.complexity || 'medium',
          sessionFiles,
          sessionId
        );
      
      case 'chat':
        return await gemini.generateWithGemini(prompt, {
        temperature: 0.7,
          maxOutputTokens: 2048,
          sessionId: sessionId
      });
      
      default:
        throw new Error(`Unsupported content type: ${type}`);
    }
  } catch (error) {
    console.error(`Error generating ${type}:`, error);
    throw error;
  }
};
