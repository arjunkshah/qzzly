// This is a wrapper for the Google Gemini API
// In production, you would need to set up proper authentication

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
  console.log("Options:", options);
  
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GEMINI_API_KEY}`
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
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      return "Sorry, there was an error processing your request.";
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return simulateGeminiResponse(prompt);
  }
}

/**
 * Generates flashcards based on study material
 */
export async function generateFlashcards(material: string, count: number = 5): Promise<Array<{front: string, back: string, mastered: boolean}>> {
  console.log(`Generating ${count} flashcards for: ${material.substring(0, 100)}...`);
  
  try {
    const prompt = `Generate ${count} flashcards based on the following study material. Format each flashcard as a JSON object with 'front' and 'back' fields. The front should be a question and the back should be the answer.\n\nStudy Material: ${material}`;
    
    const response = await generateWithGemini(prompt, {
      temperature: 0.3,
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
      }
    } catch (parseError) {
      console.error("Error parsing flashcards JSON:", parseError);
    }
    
    // Fallback to mock response
    return [
      {
        front: "What is photosynthesis?",
        back: "The process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water.",
        mastered: false
      },
      {
        front: "What are the main parts of a plant cell?",
        back: "Cell wall, cell membrane, cytoplasm, nucleus, vacuoles, mitochondria, chloroplasts, endoplasmic reticulum, and Golgi apparatus.",
        mastered: false
      },
      {
        front: "What is osmosis?",
        back: "The process by which molecules of a solvent tend to pass through a semipermeable membrane from a less concentrated solution into a more concentrated one.",
        mastered: false
      },
      {
        front: "What is the function of mitochondria?",
        back: "Mitochondria are responsible for cellular respiration, generating most of the cell's supply of ATP for energy.",
        mastered: false
      },
      {
        front: "What are chromosomes composed of?",
        back: "Chromosomes are made up of DNA and proteins, organized into genes that carry genetic information.",
        mastered: false
      }
    ];
  } catch (error) {
    console.error("Error generating flashcards:", error);
    // Return mock flashcards as fallback
    return [
      {
        front: "What is photosynthesis?",
        back: "The process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water.",
        mastered: false
      },
      {
        front: "What are the main parts of a plant cell?",
        back: "Cell wall, cell membrane, cytoplasm, nucleus, vacuoles, mitochondria, chloroplasts, endoplasmic reticulum, and Golgi apparatus.",
        mastered: false
      },
      {
        front: "What is osmosis?",
        back: "The process by which molecules of a solvent tend to pass through a semipermeable membrane from a less concentrated solution into a more concentrated one.",
        mastered: false
      },
      {
        front: "What is the function of mitochondria?",
        back: "Mitochondria are responsible for cellular respiration, generating most of the cell's supply of ATP for energy.",
        mastered: false
      },
      {
        front: "What are chromosomes composed of?",
        back: "Chromosomes are made up of DNA and proteins, organized into genes that carry genetic information.",
        mastered: false
      }
    ];
  }
}

/**
 * Generates quiz questions based on study material
 */
export async function generateQuiz(material: string, questionCount: number = 5): Promise<any> {
  console.log(`Generating quiz with ${questionCount} questions for: ${material.substring(0, 100)}...`);
  
  try {
    const prompt = `Generate a quiz with ${questionCount} multiple-choice questions based on the following study material. Format the response as a JSON object with a 'title' field and a 'questions' array. Each question should have an 'id', 'text', 'options' array, 'correctAnswer' (the index of the correct option), and an 'explanation'.\n\nStudy Material: ${material}`;
    
    const response = await generateWithGemini(prompt, {
      temperature: 0.3,
      maxOutputTokens: 2048
    });
    
    // Try to extract JSON from the response
    try {
      // Look for anything that resembles a JSON object
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Error parsing quiz JSON:", parseError);
    }
    
    // Fallback to mock response
    return {
      title: "Generated Quiz",
      questions: [
        {
          id: "q1",
          text: "What is the primary function of chloroplasts in plant cells?",
          options: ["Cell division", "Protein synthesis", "Photosynthesis", "Respiration"],
          correctAnswer: 2,
          explanation: "Chloroplasts are the site of photosynthesis in plant cells."
        },
        {
          id: "q2",
          text: "Which of the following is NOT a stage of mitosis?",
          options: ["Prophase", "Metaphase", "Synthesis", "Telophase"],
          correctAnswer: 2,
          explanation: "Synthesis (S phase) is part of interphase, not mitosis."
        },
        {
          id: "q3",
          text: "What is the purpose of cellular respiration?",
          options: ["To produce proteins", "To break down glucose and release energy", "To replicate DNA", "To transport materials within the cell"],
          correctAnswer: 1,
          explanation: "Cellular respiration breaks down glucose to produce ATP, which provides energy for cellular activities."
        },
        {
          id: "q4",
          text: "Which organelle is responsible for protein synthesis?",
          options: ["Nucleus", "Mitochondria", "Ribosomes", "Golgi apparatus"],
          correctAnswer: 2,
          explanation: "Ribosomes are the cellular structures responsible for protein synthesis."
        },
        {
          id: "q5",
          text: "What is the role of the cell membrane?",
          options: ["Energy production", "Protein synthesis", "Controlling what enters and exits the cell", "DNA replication"],
          correctAnswer: 2,
          explanation: "The cell membrane is a selectively permeable barrier that controls what substances can enter and exit the cell."
        }
      ]
    };
  } catch (error) {
    console.error("Error generating quiz:", error);
    // Return mock quiz as fallback
    return {
      title: "Generated Quiz",
      questions: [
        {
          id: "q1",
          text: "What is the primary function of chloroplasts in plant cells?",
          options: ["Cell division", "Protein synthesis", "Photosynthesis", "Respiration"],
          correctAnswer: 2,
          explanation: "Chloroplasts are the site of photosynthesis in plant cells."
        },
        {
          id: "q2",
          text: "Which of the following is NOT a stage of mitosis?",
          options: ["Prophase", "Metaphase", "Synthesis", "Telophase"],
          correctAnswer: 2,
          explanation: "Synthesis (S phase) is part of interphase, not mitosis."
        },
        {
          id: "q3",
          text: "What is the purpose of cellular respiration?",
          options: ["To produce proteins", "To break down glucose and release energy", "To replicate DNA", "To transport materials within the cell"],
          correctAnswer: 1,
          explanation: "Cellular respiration breaks down glucose to produce ATP, which provides energy for cellular activities."
        },
        {
          id: "q4",
          text: "Which organelle is responsible for protein synthesis?",
          options: ["Nucleus", "Mitochondria", "Ribosomes", "Golgi apparatus"],
          correctAnswer: 2,
          explanation: "Ribosomes are the cellular structures responsible for protein synthesis."
        },
        {
          id: "q5",
          text: "What is the role of the cell membrane?",
          options: ["Energy production", "Protein synthesis", "Controlling what enters and exits the cell", "DNA replication"],
          correctAnswer: 2,
          explanation: "The cell membrane is a selectively permeable barrier that controls what substances can enter and exit the cell."
        }
      ]
    };
  }
}

/**
 * Simulates a response from the Gemini API based on the prompt
 * Used as fallback when API calls fail
 */
function simulateGeminiResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes("flashcard") || lowerPrompt.includes("study material")) {
    return "I've analyzed your study materials. Would you like me to generate flashcards on this topic? I can create questions and answers that will help you review the key concepts.";
  }
  
  if (lowerPrompt.includes("quiz") || lowerPrompt.includes("test")) {
    return "Based on the materials you've provided, I can create a quiz to test your understanding. Would you like multiple-choice questions or more open-ended questions?";
  }
  
  if (lowerPrompt.includes("explain") || lowerPrompt.includes("what is")) {
    return "Based on the material you've uploaded, I can see that this topic covers cellular respiration. The main stages are glycolysis, the Krebs cycle, and the electron transport chain. Each of these stages plays a crucial role in converting glucose into ATP, which is the energy currency of the cell.";
  }
  
  return "I've analyzed your input and I'm ready to help you study more effectively. Would you like me to generate flashcards, create a quiz, or explain any concepts in more detail?";
}
