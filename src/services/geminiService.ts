
// This is a wrapper for the Google Gemini API

// Use the provided Gemini API key
const GEMINI_API_KEY = "AIzaSyCxykzmAuWfh4MMe3K8FliQ8uNcvqoWb2c";

export interface GeminiOptions {
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
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
    
    // Update to use gemini-1.5-flash model
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
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
    
    return data.candidates[0].content.parts[0].text;
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
function extractContentFromFiles(files: any[]): string {
  if (!files || files.length === 0) {
    return "No files available";
  }
  
  // Extract useful information from files - include more details if available
  const fileDetails = files.map(file => {
    let fileInfo = file.name.replace('.pdf', '');
    
    if (file.content) {
      return `${fileInfo}: ${file.content.substring(0, 1000)}`;
    }
    
    if (file.description) {
      return `${fileInfo}: ${file.description}`;
    }
    
    return fileInfo; 
  }).join("\n\n");
  
  return fileDetails;
}

/**
 * Generates flashcards based on study material
 */
export async function generateFlashcards(
  material: string, 
  count: number = 5, 
  complexity: string = "medium", 
  files?: any[]
): Promise<Array<{front: string, back: string, mastered: boolean}>> {
  console.log(`Generating ${count} flashcards for: ${material.substring(0, 100)}...`);
  
  try {
    // If files are provided, extract content to supplement the material
    let studyContent = material;
    if (files && files.length > 0) {
      const fileContent = extractContentFromFiles(files);
      studyContent = `${material}\n\nAdditional context from uploaded files: ${fileContent}`;
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
        complexityPrompt = " Make them detailed and comprehensive, suitable for advanced students.";
        break;
    }
    
    const prompt = `Generate ${count} flashcards based on the following study material.
    Create appropriate question-answer pairs covering key concepts from this material.
    Format each flashcard as a JSON object with 'front' and 'back' fields. The front should be a question and the back should be the answer.
    ${complexityPrompt}
    
    Study Material: ${studyContent}`;
    
    const response = await generateWithGemini(prompt, {
      temperature: 0.2,
      maxOutputTokens: 2048
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
          // If the response is not JSON, but Gemini is asking for more content
          if (response.includes("Please provide") || 
              response.includes("I need") || 
              response.includes("more information")) {
            
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
      }
      throw new Error("Could not parse JSON from response");
    } catch (parseError) {
      console.error("Error parsing flashcards JSON:", parseError, "Response:", response);
      throw new Error("Failed to parse flashcards from Gemini response");
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
  files?: any[]
): Promise<any> {
  console.log(`Generating quiz with ${questionCount} questions for: ${material.substring(0, 100)}...`);
  
  try {
    // If files are provided, extract content to supplement the material
    let studyContent = material;
    if (files && files.length > 0) {
      const fileContent = extractContentFromFiles(files);
      studyContent = `${material}\n\nAdditional context from uploaded files: ${fileContent}`;
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
    
    const prompt = `Generate a quiz with ${questionCount} multiple-choice questions based on the following study material.
    ${difficultyPrompt} ${topicPrompt} ${explanationPrompt}
    Format the response as a JSON object with a 'title' field and a 'questions' array. 
    Each question should have 'text', 'options' array, 'correctAnswer' (the index of the correct option), and an 'explanation'.
    Make sure to return ONLY a valid JSON object with no additional text.
    
    Study Material: ${studyContent}`;
    
    const response = await generateWithGemini(prompt, {
      temperature: 0.2,
      maxOutputTokens: 2048
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
      
      // If the response is not JSON but Gemini is asking for more content
      if (response.includes("Please provide") || 
          response.includes("I need") || 
          response.includes("more information")) {
        
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
      }
      
      throw new Error("Could not parse JSON from response");
    } catch (parseError) {
      console.error("Error parsing quiz JSON:", parseError, "Response:", response);
      throw new Error("Failed to parse quiz from Gemini response");
    }
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
}
