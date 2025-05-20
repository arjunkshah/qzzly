
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
    
    const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent", {
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
 * Generates flashcards based on study material
 */
export async function generateFlashcards(material: string, count: number = 5): Promise<Array<{front: string, back: string, mastered: boolean}>> {
  console.log(`Generating ${count} flashcards for: ${material.substring(0, 100)}...`);
  
  try {
    const prompt = `Generate ${count} flashcards based on the following study material. 
    Format each flashcard as a JSON object with 'front' and 'back' fields. The front should be a question and the back should be the answer.
    
    Study Material: ${material}`;
    
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
        const flashcardsData = JSON.parse(response);
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
export async function generateQuiz(material: string, questionCount: number = 5): Promise<any> {
  console.log(`Generating quiz with ${questionCount} questions for: ${material.substring(0, 100)}...`);
  
  try {
    const prompt = `Generate a quiz with ${questionCount} multiple-choice questions based on the following study material. 
    Format the response as a JSON object with a 'title' field and a 'questions' array. 
    Each question should have 'text', 'options' array, 'correctAnswer' (the index of the correct option), and an 'explanation'.
    Make sure to return ONLY a valid JSON object with no additional text.
    
    Study Material: ${material}`;
    
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
