import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export interface InterviewInputs {
  candidateName: string;
  jobRole: string;
  skills: string;
  experienceLevel: "Fresher" | "Intermediate" | "Experienced";
  interviewType: "HR" | "Technical" | "Coding" | "Mixed";
  difficulty: "Easy" | "Medium" | "Hard" | "Mixed";
  numQuestions: number;
  preferredLanguage?: string;
  duration?: string;
  specialFocus?: string;
}

export interface ResumeData {
  skills: string;
  projects: string;
  experience: string;
}

export async function parseResumeText(text: string): Promise<ResumeData> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Analyze this resume text and extract the following in a structured JSON format:
    - skills: comma separated list
    - projects: brief summary of projects
    - experience: brief summary of work/internship history
    
    Resume Text: ${text}
    
    Return ONLY JSON.`;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text().replace(/```json|```/g, ''));
  } catch (err) {
    console.error("Resume parsing error:", err);
    return { skills: "", projects: "", experience: "" };
  }
}

export async function analysisATS(inputs: InterviewInputs): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Perform an ATS (Applicant Tracking System) readiness analysis for:
    Role: ${inputs.jobRole}
    Skills: ${inputs.skills}
    Special Focus: ${inputs.specialFocus}
    Experience: ${inputs.experienceLevel}
    
    Provide a professional assessment including:
    1. Match Score (0-100)
    2. Missing Keywords
    3. Structural Recommendations
    4. Placement Probability at top-tier firms.
    
    Format as professional Markdown.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateInterviewSession(inputs: InterviewInputs) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    You are an AI Interview Preparation Assistant for Chanakya University, Department of Computer Applications (MCA Programme).
    Your role is to act as a senior technical interviewer, HR interviewer, coding evaluator, and communication coach.

    Generate a complete mock interview session based on these inputs:
    - Candidate Name: ${inputs.candidateName || "Candidate"}
    - Job Role: ${inputs.jobRole}
    - Skills/Technologies: ${inputs.skills}
    - Experience Level: ${inputs.experienceLevel}
    - Interview Type: ${inputs.interviewType}
    - Difficulty Level: ${inputs.difficulty}
    - Number of Questions: ${inputs.numQuestions}
    - Preferred Programming Language: ${inputs.preferredLanguage || "Any"}
    - Duration: ${inputs.duration || "45 Minutes"}
    - Special Focus Area: ${inputs.specialFocus || "None"}

    RULES:
    1. Questions must be technically accurate for the provided role and skills.
    2. HR questions should test communication, teamwork, leadership, and problem-solving.
    3. Technical questions must match the candidate’s experience level.
    4. Coding questions should include real-world problem-solving scenarios.
    5. Difficulty level "Mixed" should contain: 30% Easy, 50% Medium, 20% Hard.
    6. For freshers, focus more on fundamentals and projects. For experienced, include system design and optimization.
    7. Use the EXACT output format requested below.

    OUTPUT FORMAT:

    ---
    CHANAKYA UNIVERSITY
    School of Engineering
    Department of Computer Applications
    Master of Computer Applications (MCA)

    AI Interview Preparation Session

    Candidate: ${inputs.candidateName || "[CANDIDATE NAME]"}
    Role Applied: ${inputs.jobRole}
    Skills: ${inputs.skills}
    Experience Level: ${inputs.experienceLevel}
    Interview Type: ${inputs.interviewType}
    Difficulty Level: ${inputs.difficulty}
    Duration: ${inputs.duration || "45 Minutes"}

    Instructions:
    1. Answer all questions clearly and confidently.
    2. Explain technical answers with examples where necessary.
    3. Coding questions should include optimized solutions.
    4. Maintain professional communication throughout the interview.
    5. Think aloud during problem-solving questions.

    ---

    SECTION A — HR ROUND
    (Include relevant HR questions)

    ---

    SECTION B — TECHNICAL ROUND
    (Include relevant technical questions)

    ---

    SECTION C — CODING ROUND
    (Generate a coding problem with Statement, Input Format, Output Format, Constraints, and Example)

    ---

    SECTION D — SYSTEM DESIGN / SCENARIO ROUND (Optional - include if Experienced or Mixed type)

    ---

    SECTION E — AI FEEDBACK & ANALYSIS
    (Provide structured feedback on Communication, Technical Knowledge, Problem Solving, Confidence, Improvement Areas, Resources, and Summary)

    ---

    End of AI Interview Session
    ---
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating interview session:", error);
    throw new Error("Failed to generate interview session. Please check your inputs and try again.");
  }
}
