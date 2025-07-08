// Mock AI Service - No API calls
// This service provides sample data for demonstration purposes

interface FileItem {
  id: string;
  name: string;
  type: string;
  content?: string;
}

interface SessionContext {
  files: FileItem[];
  filePages?: Record<string, string[]>;
  history: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
  lastUpdated: number;
}

// In-memory context store
const sessionContexts: Record<string, SessionContext> = {};

export interface OpenAIOptions {
  temperature?: number;
  maxTokens?: number;
  sessionFiles?: FileItem[];
  sessionId?: string;
  model?: string;
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
 * Add file to session context
 */
export function addFileToSessionContext(sessionId: string, file: FileItem): void {
  const context = getSessionContext(sessionId);
    context.files.push(file);
  context.lastUpdated = Date.now();
}

/**
 * Mock function that simulates AI generation
 */
export async function generateWithOpenAI(
  prompt: string,
  options: OpenAIOptions = {}
): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Return mock responses based on prompt content
  if (prompt.toLowerCase().includes('flashcard')) {
    return `Here are some sample flashcards based on your content:

1. **Question**: What is the main topic of this document?
   **Answer**: The document covers various educational concepts and study materials.

2. **Question**: What are the key learning objectives?
   **Answer**: Understanding core concepts, improving retention, and applying knowledge.

3. **Question**: How can you best study this material?
   **Answer**: Review regularly, practice with quizzes, and create your own examples.`;
  }
  
  if (prompt.toLowerCase().includes('quiz')) {
    return `Sample Quiz Questions:

1. What is the primary focus of this study material?
   A) Historical analysis
   B) Core concepts and applications
   C) Mathematical formulas
   D) Literary criticism

2. Which study technique is most effective?
   A) Cramming the night before
   B) Regular review and practice
   C) Reading once
   D) Skipping difficult sections

3. What should you do when you encounter difficult concepts?
   A) Skip them entirely
   B) Break them down into smaller parts
   C) Memorize without understanding
   D) Give up on the topic`;
  }
  
  if (prompt.toLowerCase().includes('summary')) {
    return `Document Summary:

This document contains educational content covering various topics. The material is structured to help learners understand key concepts through examples and explanations. The content emphasizes practical application and regular review for optimal learning outcomes.

Key Points:
- Focus on understanding rather than memorization
- Regular practice improves retention
- Break complex topics into manageable parts
- Apply concepts to real-world scenarios`;
  }
  
  // Default response
  return `Based on your request, here's a helpful response that demonstrates how the AI would analyze and respond to your content. This is a sample response showing the type of assistance you would receive with the full AI integration.`;
}

/**
 * Generate flashcards using mock data
 */
export async function generateFlashcards(
  material: string, 
  count: number = 5, 
  complexity: string = "medium", 
  files?: FileItem[],
  sessionId?: string
): Promise<Array<{front: string, back: string, mastered: boolean}>> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const sampleFlashcards = [
    {
      front: "What is the main topic of this study material?",
      back: "The document covers educational concepts and learning strategies for effective study.",
      mastered: false
    },
    {
      front: "What are the three key study techniques mentioned?",
      back: "Regular review, active practice, and concept application are the three main techniques.",
      mastered: false
    },
    {
      front: "How should you approach difficult concepts?",
      back: "Break them down into smaller, manageable parts and practice regularly.",
      mastered: false
    },
    {
      front: "What is the best way to retain information?",
      back: "Spaced repetition and active recall are the most effective retention methods.",
      mastered: false
    },
    {
      front: "Why is understanding better than memorization?",
      back: "Understanding allows you to apply knowledge to new situations and solve problems creatively.",
        mastered: false
    }
  ];
  
  return sampleFlashcards.slice(0, count);
}

/**
 * Generate quiz using mock data
 */
export async function generateQuiz(
  material: string, 
  questionCount: number = 5, 
  difficulty: string = "medium",
  topic: string = "", 
  includeExplanations: boolean = true,
  questionTypes: string[] = ["multiple-choice"],
  files?: FileItem[],
  sessionId?: string
): Promise<{ title: string; questions: { text: string; options: string[]; correctAnswer: number; explanation: string; }[] }> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const sampleQuestions = [
    {
      text: "What is the primary focus of effective studying?",
      options: [
        "Memorizing facts quickly",
        "Understanding and applying concepts",
        "Reading as fast as possible",
        "Avoiding difficult topics"
      ],
      correctAnswer: 1,
      explanation: "Understanding and applying concepts is more effective than rote memorization because it helps you retain information longer and use it in new situations."
    },
    {
      text: "Which study technique is most effective for long-term retention?",
      options: [
        "Cramming the night before",
        "Spaced repetition",
        "Reading once",
        "Highlighting everything"
      ],
      correctAnswer: 1,
      explanation: "Spaced repetition involves reviewing material at increasing intervals, which is scientifically proven to improve long-term retention."
    },
    {
      text: "What should you do when you encounter a difficult concept?",
      options: [
        "Skip it entirely",
        "Break it down into smaller parts",
        "Memorize it without understanding",
        "Ask someone else to explain it"
      ],
      correctAnswer: 1,
      explanation: "Breaking difficult concepts into smaller, manageable parts makes them easier to understand and remember."
    },
    {
      text: "How often should you review your study materials?",
      options: [
        "Only before exams",
        "Once a week",
        "Regularly, with increasing intervals",
        "Never, just read once"
      ],
      correctAnswer: 2,
      explanation: "Regular review with increasing intervals (spaced repetition) is the most effective way to retain information."
    },
    {
      text: "What is the best way to test your understanding?",
      options: [
        "Rereading the material",
        "Taking practice quizzes",
        "Highlighting key points",
        "Summarizing in your own words"
      ],
      correctAnswer: 3,
      explanation: "Summarizing in your own words forces you to process and understand the material, making it more likely to stick."
    }
  ];
  
  return {
    title: `Sample Quiz on ${topic || "Study Materials"}`,
    questions: sampleQuestions.slice(0, questionCount)
  };
}

/**
 * Generate study material using mock data
 */
export async function generateStudyMaterial(
  topic: string,
  format: 'notes' | 'outline' | 'summary' = 'notes',
  complexity: string = "medium",
  files?: FileItem[],
  sessionId?: string
): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (format === 'outline') {
    return `# Study Material Outline

## 1. Introduction to Effective Studying
   - Understanding vs. memorization
   - Active learning techniques
   - Goal setting and planning

## 2. Core Study Strategies
   - Spaced repetition
   - Active recall
   - Interleaving practice
   - Elaboration techniques

## 3. Time Management
   - Pomodoro technique
   - Priority setting
   - Break scheduling
   - Review planning

## 4. Note-Taking Methods
   - Cornell method
   - Mind mapping
   - Flow notes
   - Digital tools

## 5. Test Preparation
   - Practice testing
   - Self-assessment
   - Stress management
   - Review strategies`;
  }
  
  if (format === 'summary') {
    return `Study Material Summary

This comprehensive guide covers effective study techniques and learning strategies. The material emphasizes understanding over memorization, active engagement with content, and regular review for optimal retention.

Key concepts include spaced repetition, active recall, and practical application of knowledge. The guide also covers time management, note-taking methods, and test preparation strategies.

Main takeaways:
- Focus on understanding rather than memorization
- Use active learning techniques
- Implement regular review schedules
- Practice applying knowledge to new situations
- Develop effective time management skills`;
  }
  
  return `Study Notes

Effective studying requires more than just reading and memorizing. Here are the key principles:

1. Understanding Over Memorization
   - Focus on grasping concepts rather than memorizing facts
   - Ask "why" and "how" questions
   - Connect new information to what you already know

2. Active Learning Techniques
   - Summarize information in your own words
   - Teach concepts to others
   - Create examples and analogies
   - Practice applying knowledge to new situations

3. Spaced Repetition
   - Review material at increasing intervals
   - Use flashcards or apps for regular practice
   - Schedule review sessions in advance

4. Time Management
   - Use the Pomodoro technique (25-minute focused sessions)
   - Prioritize difficult topics
   - Take regular breaks to maintain focus

5. Note-Taking Strategies
   - Use the Cornell method for structured notes
   - Create mind maps for visual learners
   - Review and revise notes regularly

Remember: The goal is not just to pass tests, but to truly understand and retain the material for long-term use.`;
}

/**
 * Generate long-form answer using mock data
 */
export async function generateLongAnswer(
  question: string,
  complexity: string = "medium",
  files?: FileItem[],
  sessionId?: string
): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return `Here's a comprehensive answer to your question about study techniques and learning strategies:

Understanding Effective Study Methods

The most effective study techniques are those that engage your brain actively rather than passively. Research shows that active learning methods lead to better retention and understanding compared to passive reading or memorization.

Key Active Learning Strategies:

1. Spaced Repetition
   This technique involves reviewing information at increasing intervals over time. Instead of cramming all at once, you review material after 1 day, then 3 days, then 1 week, and so on. This approach takes advantage of the brain's natural forgetting curve and helps move information from short-term to long-term memory.

2. Active Recall
   Rather than simply re-reading material, actively test yourself on what you've learned. This could involve creating flashcards, taking practice quizzes, or explaining concepts to others. The act of retrieving information from memory strengthens neural pathways and improves retention.

3. Interleaving
   Instead of studying one topic completely before moving to the next, mix different subjects or types of problems. This approach helps you learn to distinguish between different concepts and apply the right strategy to each situation.

4. Elaboration
   Connect new information to what you already know. Create analogies, examples, or explanations that help you understand the material more deeply. The more connections you make, the easier it is to remember and apply the information.

Practical Implementation:

Start by identifying your learning goals and the specific material you need to master. Break down complex topics into smaller, manageable chunks. Create a study schedule that incorporates regular review sessions using spaced repetition.

Use active recall techniques during your study sessions. Instead of just reading, ask yourself questions about the material, create summaries in your own words, or teach the concepts to someone else.

Remember that effective studying is not about the amount of time spent, but about the quality of your engagement with the material. Focus on understanding rather than memorization, and practice applying your knowledge to new situations.`;
}

/**
 * Generate file summary using mock data
 */
export async function generateFileSummary(
  fileName: string,
  content: string,
  sessionId?: string
): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return `Summary of ${fileName}

This document contains educational content covering various study techniques and learning strategies. The material emphasizes active learning approaches over passive memorization, including methods like spaced repetition, active recall, and elaboration techniques.

Key topics covered:
- Understanding vs. memorization
- Active learning strategies
- Time management techniques
- Note-taking methods
- Test preparation strategies

The document provides practical advice for students looking to improve their study habits and academic performance. It includes specific techniques that can be implemented immediately, along with explanations of why these methods are effective.

Main recommendations:
1. Focus on understanding concepts rather than memorizing facts
2. Use active recall and self-testing
3. Implement spaced repetition for long-term retention
4. Practice applying knowledge to new situations
5. Develop effective time management skills

This summary represents the type of analysis that would be generated by AI when processing your study materials.`;
}

/**
 * Extract topics from text (mock implementation)
 */
function extractTopicsFromText(text: string): string[] {
  return [
    "Study Techniques",
    "Learning Strategies", 
    "Memory Retention",
    "Time Management",
    "Active Learning"
  ];
}

/**
 * Extract default topics from filename
 */
function extractDefaultTopics(filename: string): string[] {
  return [
    "Document Analysis",
    "Content Review",
    "Study Materials",
    "Learning Resources"
  ];
}

/**
 * Mock file ingestion and summarization
 */
export async function ingestAndSummarizeFile(
  file: FileItem,
  sessionId: string
): Promise<{summary: string; topics: string[]}> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
      return {
    summary: `This document contains educational content that would be analyzed by AI to extract key concepts and generate study materials. The content appears to cover various topics related to learning and study techniques.`,
    topics: extractDefaultTopics(file.name)
  };
}

/**
 * Mock session file ingestion
 */
export async function ingestSessionFiles(
  sessionId: string
): Promise<Record<string, {summary: string; topics: string[]}> | null> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
    const context = getSessionContext(sessionId);
  if (context.files.length === 0) return null;
    
    const results: Record<string, {summary: string; topics: string[]}> = {};
    
    for (const file of context.files) {
    results[file.id] = {
      summary: `Sample summary for ${file.name}. This document contains educational content that would be processed by AI to extract key concepts and generate study materials.`,
      topics: extractDefaultTopics(file.name)
    };
    }
    
    return results;
}  