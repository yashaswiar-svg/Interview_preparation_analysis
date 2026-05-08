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

export type InterviewStatus = "idle" | "generating" | "completed" | "error";
