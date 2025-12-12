
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Flashcard, Task, InterviewQuestion, InterviewResult, InterviewSessionAnalysis, UserActivity } from "../types";

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

// Helper to clean and parse JSON from AI response
const parseAIJSON = <T>(text: string, defaultValue: T): T => {
  try {
    // Remove markdown code blocks if present
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Attempt to find the first array or object if there is extra text
    const firstBracket = cleanText.indexOf('[');
    const firstBrace = cleanText.indexOf('{');
    
    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      // It's likely an array
      const lastBracket = cleanText.lastIndexOf(']');
      if (lastBracket !== -1) {
        cleanText = cleanText.substring(firstBracket, lastBracket + 1);
      }
    } else if (firstBrace !== -1) {
      // It's likely an object
      const lastBrace = cleanText.lastIndexOf('}');
      if (lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }
    }

    return JSON.parse(cleanText) as T;
  } catch (error) {
    console.error("JSON Parse Error:", error, "Text:", text);
    return defaultValue;
  }
};

export const generateStudyHelp = async (
  history: ChatMessage[], 
  currentMessage: string
): Promise<string> => {
  if (!apiKey) return "Please configure your Gemini API Key.";

  try {
    const model = 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        ...history.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        {
          role: 'user',
          parts: [{ text: currentMessage }]
        }
      ]
    });

    return response.text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error while thinking. Please check your connection or API key.";
  }
};

export const generateChapterFlashcards = async (
  subject: string,
  chapter: string,
  grade: string
): Promise<Flashcard[]> => {
  if (!apiKey) return [];

  try {
    const prompt = `
      Act as a world-class JEE (Joint Entrance Examination) Expert Tutor. 
      Target: Create a comprehensive, high-quality flashcard deck for the Subject: "${subject}", Chapter: "${chapter}" (Grade ${grade}).

      INSTRUCTIONS:
      1. **Deep Dive Analysis**: First, mentally break down this chapter into every single sub-topic and concept available in standard JEE syllabus (NCERT + Advanced level).
      2. **Topic-Wise Generation**: For *EACH* identified sub-topic, generate specific flashcards. Do not skip any minor topics.
      3. **Content Types**:
         - **Formula**: Exact mathematical/chemical formulas (use clear text representation).
         - **Concept**: Core definitions, laws, or theorems.
         - **Mnemonic**: Creative memory aids/tricks to remember complex lists or sequences.
         - **Common Mistake**: Highlight where students typically lose marks or have misconceptions (Front: "What is a common mistake in...?", Back: "Students often forget that...").
      4. **Quality & Quantity**: Generate as many high-quality cards as necessary to cover the *entire* chapter thoroughly (aim for 15-25+ cards).
      
      OUTPUT FORMAT:
      Strictly return a valid JSON array. Do not wrap in markdown code blocks.
      [
        {
          "id": "unique_id_1",
          "front": "Question / Formula Name / Concept Title",
          "back": "Detailed Answer / Formula / Explanation",
          "type": "concept" | "formula" | "mnemonic" | "common_mistake",
          "topic": "Specific Sub-topic Name (e.g., 'Projectile Motion', 'Bohr Model')"
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json'
      }
    });

    return parseAIJSON<Flashcard[]>(response.text || "[]", []);
  } catch (error) {
    console.error("Flashcard Gen Error:", error);
    return [];
  }
};

export const prioritizeTasksWithAI = async (tasks: Task[]): Promise<Task[]> => {
  if (!apiKey || tasks.length === 0) return tasks;

  try {
    const prompt = `
      You are a strict Time Management Coach for a JEE Aspirant.
      
      I will provide a list of daily tasks. Your job is to:
      1. Analyze the importance of each task (Study is #1 priority, Sleep is #2, Fun/Other is #3).
      2. Check for deadlines (tasks with passed or upcoming deadlines are High priority).
      3. Assign a priority level ('High', 'Medium', 'Low') to each task.
      4. Sort the list so High priority tasks come first.
      
      Input Tasks:
      ${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, category: t.category, deadline: t.deadline })))}

      OUTPUT FORMAT:
      Return a JSON array of objects containing ONLY the 'id' and the assigned 'priority'.
      Example: [{"id": "1", "priority": "High"}, {"id": "3", "priority": "Low"}]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const rankedData = parseAIJSON<{ id: string, priority: 'High' | 'Medium' | 'Low' }[]>(response.text || "[]", []);

    const rankedTasks: Task[] = [];
    const remainingTasks = [...tasks];

    rankedData.forEach(rank => {
      const index = remainingTasks.findIndex(t => t.id === rank.id);
      if (index !== -1) {
        const task = remainingTasks[index];
        rankedTasks.push({ ...task, priority: rank.priority });
        remainingTasks.splice(index, 1);
      }
    });

    return [...rankedTasks, ...remainingTasks];

  } catch (error) {
    console.error("Task Prioritization Error:", error);
    return tasks;
  }
};

// --- New Functions for IIT Interview Feature ---

export const generateInterviewQuestions = async (topic: string, subject: string): Promise<InterviewQuestion[]> => {
  if (!apiKey) return [];

  try {
    const prompt = `
      You are an IIT Bombay Professor conducting a rigorous viva/interview for JEE Advanced.
      Topic: "${topic}" (Subject: ${subject}).
      
      Goal: Generate 10 extremely conceptual, tricky, and application-based questions that test the depth of the student's understanding.
      The questions should NOT be simple definitions. They should ask "Why", "How", "What happens if", or involve multi-concept application suitable for JEE Advanced level.
      
      OUTPUT FORMAT (Strict JSON Array):
      [
        {
          "id": "1",
          "question": "The actual question text",
          "correctAnswer": "The ideal detailed answer containing the concept key points.",
          "concept": "Name of the core concept tested",
          "difficulty": "Medium" | "Hard" | "Advanced"
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    return parseAIJSON<InterviewQuestion[]>(response.text || "[]", []);
  } catch (error) {
    console.error("Interview Gen Error:", error);
    return [];
  }
};

export const evaluateInterviewAnswer = async (
  question: string, 
  idealAnswer: string, 
  userAnswer: string
): Promise<InterviewResult> => {
  if (!apiKey) {
      return {
          questionId: 'error',
          userAnswer: userAnswer,
          score: 0,
          feedback: "API Key Missing",
          conceptExplanation: "Cannot evaluate.",
          applauseOrTaunt: "Error"
      };
  }

  try {
    const prompt = `
      You are a strict but motivating JEE Advanced Coach.
      Question: "${question}"
      Ideal Answer: "${idealAnswer}"
      Student's Answer (Voice Transcript): "${userAnswer}"

      Task:
      1. Evaluate the student's logic and understanding. Is it correct?
      2. Score it from 0 to 10.
      3. Provide a "Feedback" (Review) - point out specific errors or praise specific insight.
      4. Provide a "Concept Explanation" - Explain the concept clearly using Hinglish (Hindi+English mix) or Marathi+English mix to make it stick. Use analogies.
      5. If score < 7, provide a "FollowUpProblem" (short numerical or conceptual question) to test them again.
      6. Provide an "ApplauseOrTaunt" phrase:
         - If score >= 8: Use phrase like "चला कोणीतरी हुशार आहे भो" or "Ek number bhau!" or "IIT Bombay material right here!".
         - If score < 5: Use phrase like "Are vedya..." or "Concepts hila hua hai tera" or motivational scolding.

      OUTPUT FORMAT (JSON):
      {
        "score": number,
        "feedback": "string",
        "conceptExplanation": "string",
        "followUpProblem": "string (optional)",
        "applauseOrTaunt": "string"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    const result = parseAIJSON<any>(response.text || "{}", {});
    
    // Validate minimal fields
    if (typeof result.score !== 'number') result.score = 0;
    if (!result.feedback) result.feedback = "Could not evaluate.";
    
    return {
        questionId: 'temp', // handled by caller
        userAnswer,
        ...result
    };
  } catch (error) {
    console.error("Evaluation Error:", error);
    return {
        questionId: 'error',
        userAnswer,
        score: 0,
        feedback: "Error evaluating answer.",
        conceptExplanation: "Please try again.",
        applauseOrTaunt: "Error"
    };
  }
};

export const generateInterviewAnalysis = async (results: InterviewResult[]): Promise<InterviewSessionAnalysis> => {
    if (!apiKey) return {
        conceptualUnderstanding: 0,
        applicationSkills: 0,
        formulaRetention: 0,
        strategicAdvice: "API Key Missing",
        weakTopics: []
    };

    try {
        const prompt = `
          Analyze this JEE Advanced Mock Interview Session.
          Results: ${JSON.stringify(results.map(r => ({ score: r.score, feedback: r.feedback, concept: r.conceptExplanation })))}

          Task:
          1. Estimate scores (0-100) for Conceptual Understanding, Application Skills, and Formula Retention based on the answers.
          2. Provide "Strategic Advice": Detailed study plan. Does he need more reading? More problem solving? Ratta maar? Be specific.
          3. List "Weak Topics".

          OUTPUT FORMAT (JSON):
          {
            "conceptualUnderstanding": number,
            "applicationSkills": number,
            "formulaRetention": number,
            "strategicAdvice": "string",
            "weakTopics": ["string", "string"]
          }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: 'application/json' }
        });

        return parseAIJSON<InterviewSessionAnalysis>(response.text || "{}", {
            conceptualUnderstanding: 0,
            applicationSkills: 0,
            formulaRetention: 0,
            strategicAdvice: "Could not generate analysis.",
            weakTopics: []
        });
    } catch (e) {
        console.error(e);
        return {
            conceptualUnderstanding: 0,
            applicationSkills: 0,
            formulaRetention: 0,
            strategicAdvice: "Error generating analysis.",
            weakTopics: []
        };
    }
};

export const analyzeUserActivity = async (activityLog: UserActivity[]): Promise<{ report: string }> => {
  if (!apiKey) return { report: "API Key missing." };
  
  if (activityLog.length === 0) return { report: "No data available for analysis yet." };

  try {
    const prompt = `
      You are a Behavioural Analytics AI for JEE Aspirants.
      
      I have tracked the student's app usage activity. Use this as a proxy for their wake-up and sleep times.
      Data: ${JSON.stringify(activityLog)}

      Task:
      1. Analyze their sleep schedule consistency. Are they waking up early? Sleeping too late?
      2. Calculate average active hours (Difference between Last Active and First Active).
      3. Provide a strict, "Big Brother" style report for the Admin/Parent.
      4. Suggest interventions if the schedule is erratic.

      Output as a simple markdown string/paragraph. Do not use JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    return { report: response.text || "Could not generate report." };

  } catch (e) {
    console.error(e);
    return { report: "Error analyzing behavior." };
  }
};
