// This is a wrapper for the Google Gemini API

// Use the provided Gemini API key
const GEMINI_API_KEY = "AIzaSyCxykzmAuWfh4MMe3K8FliQ8uNcvqoWb2c";

// Store API contexts for each session
interface SessionContext {
  files: any[];
  history: {
    role: 'user' | 'model';
    content: string;
  }[];
  lastUpdated: number;
}

// In-memory context store
const sessionContexts: Record<string, SessionContext> = {};

export interface GeminiOptions {
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
  sessionFiles?: any[];
  sessionId?: string;
}

/**
 * Initialize or get a session context
 */
export function getSessionContext(sessionId: string): SessionContext {
  if (!sessionContexts[sessionId]) {
    sessionContexts[sessionId] = {
      files: [],
      history: [],
      lastUpdated: Date.now()
    };
  }
  return sessionContexts[sessionId];
}

/**
 * Add a file to the session context
 */
export function addFileToSessionContext(sessionId: string, file: any): void {
  const context = getSessionContext(sessionId);
  
  // Check if file already exists
  const existingIndex = context.files.findIndex(f => f.id === file.id);
  if (existingIndex >= 0) {
    // Update existing file
    context.files[existingIndex] = file;
  } else {
    // Add new file
    context.files.push(file);
  }
  
  // Add a history entry about the file
  const hasContent = file.content ? ' (with content)' : '';
  context.history.push({
    role: 'user',
    content: `I've uploaded a file named "${file.name}" of type "${file.type}"${hasContent}. Please remember this for future reference.`
  });
  
  context.lastUpdated = Date.now();
  
  console.log(`Added file ${file.name} to session ${sessionId} context. Total files: ${context.files.length}`);
}

/**
 * Generates content using the Gemini API
 * @param prompt The user's input prompt
 * @param options Optional configuration for the Gemini model
 */
export async function generateWithGemini(
  prompt: string,
  options: GeminiOptions = {}
): Promise<string> {
  console.log("Prompt to Gemini:", prompt);
  
  try {
    // Log the API key (first few characters) to help debug
    console.log("Using API key starting with:", GEMINI_API_KEY.substring(0, 5) + "...");
    
    // Create an array of parts for the request
    const parts = [{ text: prompt }];
    
    // Get session context if provided
    let sessionContext: SessionContext | undefined;
    if (options.sessionId) {
      sessionContext = getSessionContext(options.sessionId);
      
      // Add this prompt to history
      sessionContext.history.push({
        role: 'user',
        content: prompt
      });
    }
    
    // If using session context, build history
    let history = [];
    if (sessionContext) {
      // Format history for Gemini API
      history = sessionContext.history.map(entry => ({
        role: entry.role,
        parts: [{ text: entry.content }]
      }));
      
      // Include file information
      if (sessionContext.files.length > 0) {
        const fileInfo = sessionContext.files
          .map(file => `${file.name} (${file.type})${file.content ? ' - Content analyzed' : ''}`)
          .join(", ");
        
        parts.push({ text: `\n\nFiles available in this session: ${fileInfo}. You have access to the content of these files and can reference them in your responses.` });
      }
    } else if (options.sessionFiles && options.sessionFiles.length > 0) {
      // If no session context but files were provided
      const fileInfo = options.sessionFiles
        .map(file => `${file.name} (${file.type})`)
        .join(", ");
      
      parts.push({ text: `\n\nFiles available for reference: ${fileInfo}` });
    }
    
    // Update to use gemini-1.5-flash model
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: history.length > 0 ? history : [{ parts: parts }],
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxOutputTokens || 2048,
          topK: options.topK || 40,
          topP: options.topP || 0.95
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: { message: errorText } };
      }
      
      console.error("Gemini API error:", errorData);
      console.error("Response status:", response.status);
      
      // Special handling for 401 errors
      if (response.status === 401) {
        throw new Error("Authentication failed: API key may be invalid or expired");
      }
      
      throw new Error(`API Error: ${errorData.error?.message || response.statusText || "Unknown error"}`);
    }
    
    const data = await response.json();
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error("Invalid response format from Gemini API");
    }
    
    const responseText = data.candidates[0].content.parts[0].text;
    
    // Add model response to history if using session context
    if (sessionContext) {
      sessionContext.history.push({
        role: 'model',
        content: responseText
      });
      
      // Trim history if it gets too long (keep last 20 entries)
      if (sessionContext.history.length > 20) {
        sessionContext.history = sessionContext.history.slice(-20);
      }
      
      sessionContext.lastUpdated = Date.now();
    }
    
    return responseText;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

/**
 * Extracts content from files to use as study material
 * @param files Array of file items to extract content from
 * @returns A string representation of the file contents
 */
async function extractContentFromFiles(files: any[]): Promise<string> {
  if (!files || files.length === 0) {
    return "No files available";
  }
  
  let content = "Content from uploaded files:\n\n";
  
  for (const file of files) {
    content += `File: ${file.name}\n`;
    
    if (file.content) {
      try {
        // For any file type, indicate that content is available for processing
        content += `Content: File content is available for AI analysis (${file.content.length} characters)\n\n`;
        
        // If the file has text chunks, include them
        if (file.textChunks && file.textChunks.length > 0) {
          content += `Text chunks available: ${file.textChunks.length}\n\n`;
        }
      } catch (error) {
        console.error(`Error processing content from ${file.name}:`, error);
        content += `Error processing content from this file.\n\n`;
      }
    } else {
      content += "No content available for this file.\n\n";
    }
  }
  
  return content;
}

/**
 * Generates flashcards based on study material
 */
export async function generateFlashcards(
  material: string, 
  count: number = 5, 
  complexity: string = "medium", 
  files?: any[],
  sessionId?: string
): Promise<Array<{front: string, back: string, mastered: boolean}>> {
  console.log(`Generating ${count} flashcards for: ${material.substring(0, 100)}...`);
  
  try {
    // If sessionId is provided, use session context files (which have content)
    let filesToUse = files;
    if (sessionId) {
      const sessionContext = getSessionContext(sessionId);
      if (sessionContext.files && sessionContext.files.length > 0) {
        filesToUse = sessionContext.files;
        console.log(`Using ${filesToUse.length} files from session context for flashcard generation`);
      }
    }
    
    let complexityPrompt = "";
    switch (complexity) {
      case "simple":
        complexityPrompt = " Make them very simple and easy to understand, suitable for beginners.";
        break;
      case "medium":
        complexityPrompt = " Make them clear and concise with moderate detail.";
        break;
      case "advanced":
        complexityPrompt = " Make them detailed but still concise, suitable for advanced students.";
        break;
    }
    
    // CHUNKED PROCESSING: If any file has textChunks, process each chunk and aggregate results
    if (filesToUse && filesToUse.length > 0 && filesToUse[0].textChunks && filesToUse[0].textChunks.length > 0) {
      console.log('Processing file in chunks for Gemini flashcard generation');
      let allFlashcards: any[] = [];
      for (const file of filesToUse) {
        if (file.textChunks && file.textChunks.length > 0) {
          for (const chunk of file.textChunks) {
            const prompt = `Generate ${count} concise flashcards based on the following study material chunk.\n\n${chunk}\n\nCreate appropriate question-answer pairs covering key concepts from the chunk. Format each flashcard as a JSON object with 'front' and 'back' fields. The front should be a short question (1-2 sentences max) and the back should be a brief answer (1-3 sentences max).${complexityPrompt}\nReturn ONLY a valid JSON array of flashcard objects, no additional text.`;
            const response = await generateWithGemini(prompt, {
              temperature: 0.2,
              maxOutputTokens: 2048,
              sessionId: sessionId
            });
            // Try to extract JSON array from the response
            try {
              const jsonMatch = response.match(/\[[\s\S]*\]/);
              if (jsonMatch) {
                const flashcardsData = JSON.parse(jsonMatch[0]);
                allFlashcards = allFlashcards.concat(flashcardsData.map((card: any) => ({
                  front: card.front,
                  back: card.back,
                  mastered: false
                })));
              }
            } catch (parseError) {
              console.error('Error parsing flashcards JSON from chunk:', parseError, 'Response:', response);
            }
          }
        }
      }
      // Optionally deduplicate flashcards by front text
      const uniqueFlashcards = Array.from(new Map(allFlashcards.map(fc => [fc.front, fc])).values());
      return uniqueFlashcards;
    }
    
    const prompt = `Generate ${count} concise flashcards based on the following study material: "${material}".
    
    Create appropriate question-answer pairs covering key concepts from the uploaded documents and the study material.
    Format each flashcard as a JSON object with 'front' and 'back' fields. The front should be a short question (1-2 sentences max) and the back should be a brief answer (1-3 sentences max).
    
    IMPORTANT: Keep each flashcard concise. The front should be a short question (1-2 sentences max) and the back should be a brief answer (1-3 sentences max).
    ${complexityPrompt}
    
    Return ONLY a valid JSON array of flashcard objects, no additional text.`;

    // If we have files with content, use the direct API approach like ingestAndSummarizeFile
    if (filesToUse && filesToUse.length > 0 && filesToUse[0].content) {
      console.log(`Sending file content directly to Gemini API for flashcard generation`);
      
      // Build parts array with text prompt and file content
      const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [{ text: prompt }];
      
      // Add each file's content
      for (const file of filesToUse) {
        if (file.content) {
          parts.push({
            text: file.content
          });
        }
      }
      
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: parts
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            topK: 40,
            topP: 0.95
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error from Gemini API: ${errorText}`);
        throw new Error(`Failed to generate flashcards with Gemini API: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid response format from Gemini API");
      }
      
      const responseText = data.candidates[0].content.parts[0].text;
      console.log(`Received flashcard response from Gemini API (${responseText.length} chars)`);
      
      // Try to extract JSON array from the response
      try {
        // Look for anything that resembles a JSON array
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const flashcardsData = JSON.parse(jsonMatch[0]);
          return flashcardsData.map((card: any) => ({
            front: card.front,
            back: card.back,
            mastered: false
          }));
        } else {
          // Try parsing the entire response as JSON
          const flashcardsData = JSON.parse(responseText);
          if (Array.isArray(flashcardsData)) {
            return flashcardsData.map((card: any) => ({
              front: card.front,
              back: card.back,
              mastered: false
            }));
          }
        }
        throw new Error("Could not parse JSON from response");
      } catch (parseError) {
        console.error("Error parsing flashcards JSON:", parseError, "Response:", responseText);
        throw new Error("Failed to parse flashcards from Gemini response");
      }
    } else {
      // Fallback to the old method if no files with content
    const response = await generateWithGemini(prompt, {
      temperature: 0.2,
      maxOutputTokens: 2048,
      sessionId: sessionId
    });
    
    // Try to extract JSON array from the response
    try {
      // Look for anything that resembles a JSON array
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const flashcardsData = JSON.parse(jsonMatch[0]);
        return flashcardsData.map((card: any) => ({
          front: card.front,
          back: card.back,
          mastered: false
        }));
      } else {
        // Try parsing the entire response as JSON
        try {
          const flashcardsData = JSON.parse(response);
          if (Array.isArray(flashcardsData)) {
            return flashcardsData.map((card: any) => ({
              front: card.front,
              back: card.back,
              mastered: false
            }));
          }
        } catch (parseError) {
            // Return default flashcards when Gemini can't generate based on provided content
            return [
              {
                front: "What is the main subject of this study session?",
                back: "The subject appears to be related to: " + material.split(" ").slice(0, 5).join(" "),
                mastered: false
              },
              {
                front: "How would you create effective flashcards for this topic?",
                back: "First identify key concepts, then create clear questions on one side with concise answers on the other.",
                mastered: false
              },
              {
                front: "What are some effective study techniques?",
                back: "Spaced repetition, active recall, concept mapping, summarization, and teaching the material to others.",
                mastered: false
              }
            ];
        }
      }
      throw new Error("Could not parse JSON from response");
    } catch (parseError) {
      console.error("Error parsing flashcards JSON:", parseError, "Response:", response);
      throw new Error("Failed to parse flashcards from Gemini response");
      }
    }
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw error;
  }
}

/**
 * Generates quiz questions based on study material
 */
export async function generateQuiz(
  material: string, 
  questionCount: number = 5, 
  difficulty: string = "medium",
  topic: string = "", 
  includeExplanations: boolean = true,
  files?: any[],
  sessionId?: string
): Promise<any> {
  console.log(`Generating quiz with ${questionCount} questions for: ${material.substring(0, 100)}...`);
  
  try {
    // If sessionId is provided, use session context files (which have content)
    let filesToUse = files;
    if (sessionId) {
      const sessionContext = getSessionContext(sessionId);
      if (sessionContext.files && sessionContext.files.length > 0) {
        filesToUse = sessionContext.files;
        console.log(`Using ${filesToUse.length} files from session context for quiz generation`);
      }
    }
    
    let difficultyPrompt = "";
    switch (difficulty) {
      case "easy":
        difficultyPrompt = "Make the questions easy, suitable for beginners.";
        break;
      case "medium":
        difficultyPrompt = "Make the questions moderately challenging.";
        break;
      case "hard":
        difficultyPrompt = "Make the questions challenging, suitable for advanced students.";
        break;
    }
    
    let topicPrompt = topic ? `Focus the questions on the topic of ${topic}.` : "";
    let explanationPrompt = includeExplanations ? "Include detailed explanations for each answer." : "Keep explanations brief.";
    
    const prompt = `Generate a quiz with EXACTLY ${questionCount} multiple-choice questions based on the following study material: "${material}".
    
    Create questions covering key concepts from the uploaded documents and the study material.
    ${difficultyPrompt} ${topicPrompt} ${explanationPrompt}
    Format the response as a JSON object with a 'title' field and a 'questions' array containing EXACTLY ${questionCount} questions. 
    Each question should have 'text', 'options' array, 'correctAnswer' (the index of the correct option), and an 'explanation'.
    Make sure to return ONLY a valid JSON object with no additional text.`;

    // If we have files with content, use the direct API approach
    if (filesToUse && filesToUse.length > 0 && filesToUse[0].content) {
      console.log(`Sending file content directly to Gemini API for quiz generation`);
      
      // Build parts array with text prompt and file content
      const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [{ text: prompt }];
      
      // Add each file's content
      for (const file of filesToUse) {
        if (file.content) {
          parts.push({
            text: file.content
          });
        }
      }
      
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: parts
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
            topK: 40,
            topP: 0.95
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error from Gemini API: ${errorText}`);
        throw new Error(`Failed to generate quiz with Gemini API: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid response format from Gemini API");
      }
      
      const responseText = data.candidates[0].content.parts[0].text;
      console.log(`Received quiz response from Gemini API (${responseText.length} chars)`);
      
      // Try to extract JSON from the response
      try {
        // Look for anything that resembles a JSON object
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          // Try parsing the entire response as JSON
          const quizData = JSON.parse(responseText);
          if (typeof quizData === 'object' && quizData !== null) {
            return quizData;
          }
        }
        throw new Error("Could not parse JSON from response");
      } catch (parseError) {
        console.error("Error parsing quiz JSON:", parseError, "Response:", responseText);
        throw new Error("Failed to parse quiz from Gemini response");
      }
    } else {
      // Fallback to the old method if no files with content
    const response = await generateWithGemini(prompt, {
      temperature: 0.2,
      maxOutputTokens: 4096,
      sessionId: sessionId
    });
    
    // Try to extract JSON from the response
    try {
      // Look for anything that resembles a JSON object
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the entire response as JSON
        const quizData = JSON.parse(response);
        if (typeof quizData === 'object' && quizData !== null) {
          return quizData;
        }
      }
        
        // Return default quiz when Gemini can't generate based on provided content
        return {
          title: "Default Quiz on Study Techniques",
          questions: [
            {
              text: "What is the spaced repetition technique?",
              options: [
                "Studying for long hours at a time",
                "Reviewing material at increasing intervals over time",
                "Studying the same material repeatedly in one session",
                "Taking frequent breaks during study sessions"
              ],
              correctAnswer: 1,
              explanation: "Spaced repetition involves reviewing material at systematically increasing intervals to improve long-term retention."
            },
            {
              text: "What study technique involves teaching material to others?",
              options: [
                "Active recall",
                "Feynman technique",
                "Mind mapping",
                "Pomodoro technique"
              ],
              correctAnswer: 1,
              explanation: "The Feynman technique involves explaining concepts in simple terms as if teaching someone else, which helps identify gaps in understanding."
            },
            {
              text: "Which is more effective for learning?",
              options: [
                "Passive reading",
                "Highlighting text",
                "Active recall practice",
                "Rereading notes"
              ],
              correctAnswer: 2,
              explanation: "Active recall, which involves retrieving information from memory, is one of the most effective study techniques."
            }
          ]
        };
      
      throw new Error("Could not parse JSON from response");
    } catch (parseError) {
      console.error("Error parsing quiz JSON:", parseError, "Response:", response);
      throw new Error("Failed to parse quiz from Gemini response");
      }
    }
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
}

/**
 * Generates detailed study material based on a topic
 */
export async function generateStudyMaterial(
  topic: string,
  format: 'notes' | 'outline' | 'summary' = 'notes',
  complexity: string = "medium",
  files?: any[],
  sessionId?: string
): Promise<string> {
  console.log(`Generating study material for topic: ${topic}`);
  
  try {
    // If sessionId is provided, use session context files (which have content)
    let filesToUse = files;
    if (sessionId) {
      const sessionContext = getSessionContext(sessionId);
      if (sessionContext.files && sessionContext.files.length > 0) {
        filesToUse = sessionContext.files;
        console.log(`Using ${filesToUse.length} files from session context for study material generation`);
      }
    }
    
    // If files are provided, extract content to supplement the material
    let contextContent = topic;
    if (filesToUse && filesToUse.length > 0) {
      const fileContent = await extractContentFromFiles(filesToUse);
      contextContent = `${topic}\n\nAdditional context from uploaded files:\n${fileContent}`;
    }
    
    let complexityPrompt = "";
    switch (complexity) {
      case "simple":
        complexityPrompt = "Write at a beginner level, using simple language and clear explanations.";
        break;
      case "medium":
        complexityPrompt = "Write at an intermediate level, with moderate detail and some technical terms.";
        break;
      case "advanced":
        complexityPrompt = "Write at an advanced level, with detailed explanations and appropriate technical terminology.";
        break;
    }
    
    let formatPrompt = "";
    switch (format) {
      case "notes":
        formatPrompt = "Format the material as detailed study notes with headings, subheadings, and bullet points.";
        break;
      case "outline":
        formatPrompt = "Format the material as a structured outline with main points and supporting details.";
        break;
      case "summary":
        formatPrompt = "Format the material as a comprehensive summary of the key concepts and their relationships.";
        break;
    }
    
    const prompt = `Generate detailed study material on the topic: ${contextContent}.
    
    ${formatPrompt}
    ${complexityPrompt}
    
    Include definitions, explanations, examples, and relationships between concepts.
    The study material should be comprehensive enough for a student to understand the topic thoroughly.`;
    
    const response = await generateWithGemini(prompt, {
      temperature: 0.3,
      maxOutputTokens: 4096,
      sessionId: sessionId
    });
    
    return response;
  } catch (error) {
    console.error("Error generating study material:", error);
    throw error;
  }
}

/**
 * Generates a long-answer response to a question
 */
export async function generateLongAnswer(
  question: string,
  complexity: string = "medium",
  files?: any[],
  sessionId?: string
): Promise<string> {
  console.log(`Generating long answer for question: ${question}`);
  
  try {
    // If sessionId is provided, use session context files (which have content)
    let filesToUse = files;
    if (sessionId) {
      const sessionContext = getSessionContext(sessionId);
      if (sessionContext.files && sessionContext.files.length > 0) {
        filesToUse = sessionContext.files;
        console.log(`Using ${filesToUse.length} files from session context for long answer generation`);
      }
    }
    
    // If files are provided, extract content to supplement the material
    let contextContent = question;
    if (filesToUse && filesToUse.length > 0) {
      const fileContent = await extractContentFromFiles(filesToUse);
      contextContent = `${question}\n\nAdditional context from uploaded files:\n${fileContent}`;
    }
    
    let complexityPrompt = "";
    switch (complexity) {
      case "simple":
        complexityPrompt = "Answer at a beginner level, using simple language and clear explanations.";
        break;
      case "medium":
        complexityPrompt = "Answer at an intermediate level, with moderate detail and some technical terms.";
        break;
      case "advanced":
        complexityPrompt = "Answer at an advanced level, with detailed explanations and appropriate technical terminology.";
        break;
    }
    
    const prompt = `Answer the following question comprehensively: ${contextContent}
    
    ${complexityPrompt}
    
    Provide a thorough explanation with examples where appropriate.
    The answer should be detailed enough for a student to gain a complete understanding of the topic.`;
    
    const response = await generateWithGemini(prompt, {
      temperature: 0.3,
      maxOutputTokens: 4096,
      sessionId: sessionId
    });
    
    return response;
  } catch (error) {
    console.error("Error generating long answer:", error);
    throw error;
  }
}

/**
 * Ingests a file and generates a summary
 * @param file The file to ingest and summarize
 * @param sessionId The session ID for context
 */
export async function ingestAndSummarizeFile(
  file: any,
  sessionId: string
): Promise<{summary: string; topics: string[]}> {
  console.log(`[API] 🔍 Ingesting file: ${file.name} (${file.type})`);
  
  try {
    // Add file to session context if not already there
    addFileToSessionContext(sessionId, file);
    
    // Get the session context
    const context = getSessionContext(sessionId);
    
    if (!file.content) {
      throw new Error('No file content available for processing');
    }

    console.log(`[API] Processing file content (${file.content.length} chars)`);
    
        const prompt = `
I'm uploading a PDF document called "${file.name}" for you to analyze.

Please analyze this PDF and provide EXACTLY the following format:

**SUMMARY:**
Write a concise 2-3 paragraph summary of the main content. Use clear, readable formatting without asterisks or bullet points. Focus on the key concepts and main ideas.

**TOPICS:**
List 5-8 single-word topics that represent the main concepts in this document. Each topic should be one word only (e.g., "Democracy", "Stalin", "Fascism", "WWII").

Keep the response clean and well-formatted for easy reading.`;

        // Use a binary parts approach to send the file
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: prompt },
                  { text: file.content }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
          maxOutputTokens: 2048,
              topK: 40,
              topP: 0.95
            }
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
      console.error(`[API] Error from Gemini API with file content: ${errorText}`);
          throw new Error(`Failed to process file with Gemini API: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
          throw new Error("Invalid response format from Gemini API");
        }
        
        const responseText = data.candidates[0].content.parts[0].text;
    console.log(`[API] Received response (${responseText.length} chars) from file content request`);
        
        // Add model response to history
        context.history.push({
          role: 'model',
          content: `I've analyzed the PDF file "${file.name}" and can answer questions about it.`
        });
        
        // Extract topics from the response
    const topics = extractTopicsFromResponse(responseText);
        
        return {
          summary: responseText,
          topics: topics.length > 0 ? topics : extractDefaultTopics(file.name)
        };
  } catch (error) {
    console.error(`[API] ❌ Error ingesting file ${file.name}:`, error);
    throw error;
  }
}

// Helper function to extract topics from the new response format
function extractTopicsFromResponse(text: string): string[] {
  // Look for the TOPICS section
  const topicsMatch = text.match(/\*\*TOPICS:\*\*\s*([\s\S]*?)(?=\n\n|\*\*|$)/i);
  
  if (topicsMatch) {
    const topicsSection = topicsMatch[1];
    // Extract single words, removing any formatting
    const topics = topicsSection
      .split(/[,\n\r]/)
      .map(topic => topic.trim().replace(/[^\w]/g, ''))
      .filter(topic => topic.length > 2 && topic.length < 20)
      .slice(0, 8); // Limit to 8 topics
    
    return topics;
  }
  
  // Fallback to the old method if new format not found
  return extractTopicsFromText(text);
}

// Helper function to extract topics from text (fallback)
function extractTopicsFromText(text: string): string[] {
  // Look for topics in bullet points or numbered lists
  const bulletMatches = text.match(/[-•*]\s*(.*?)(?=\n|$)/g) || [];
  const numberedMatches = text.match(/\d+\.\s*(.*?)(?=\n|$)/g) || [];
  
  const topics = [
    ...bulletMatches.map(match => match.replace(/[-•*]\s*/, '').trim()),
    ...numberedMatches.map(match => match.replace(/\d+\.\s*/, '').trim())
  ];
  
  // Filter out very short topics and duplicates
  return [...new Set(topics.filter(topic => topic.length > 3))];
}

// Helper function to generate default topics from filename
function extractDefaultTopics(filename: string): string[] {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  
  // Split by common separators
  const parts = nameWithoutExt.split(/[-_\s.]/);
  
  // Filter out very short parts and format them
  const topics = parts
    .filter(part => part.length > 2)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1));
  
  // Add the full filename without extension as a topic
  topics.push(nameWithoutExt);
  
  // Remove duplicates
  return [...new Set(topics)];
}

/**
 * Ingests all files in a session and generates summaries
 */
export async function ingestSessionFiles(
  sessionId: string
): Promise<Record<string, {summary: string; topics: string[]}>| null> {
  console.log(`Ingesting all files for session ${sessionId}`);
  
  try {
    // Get the session context
    const context = getSessionContext(sessionId);
    
    if (!context.files || context.files.length === 0) {
      console.log("No files to ingest in this session");
      return null;
    }
    
    const results: Record<string, {summary: string; topics: string[]}> = {};
    
    // Process each file - limit to 5 files at a time to avoid overwhelming the API
    const filesToProcess = context.files.slice(0, 5);
    
    // Use Promise.all to process files concurrently
    await Promise.all(filesToProcess.map(async (file) => {
      try {
        const result = await ingestAndSummarizeFile(file, sessionId);
        results[file.name] = result;
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        results[file.name] = {
          summary: "Error processing this file",
          topics: []
        };
      }
    }));
    
    // Add a history entry about the ingestion
    context.history.push({
      role: 'model',
      content: `I've ingested ${filesToProcess.length} files from this session and generated summaries for each.`
    });
    
    return results;
  } catch (error) {
    console.error("Error ingesting session files:", error);
    return null;
  }
}
