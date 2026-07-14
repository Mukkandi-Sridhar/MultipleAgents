export interface ExtractedQuestion {
  extracted_text: string;
  subject: string;
  concept: string;
  difficulty: string;
  explanation: string;
  prompt: string;
  mastery_answer?: string;
}

export interface AttemptLog {
  student_answer: string;
  correct: boolean;
  mistake_type?: 'conceptual' | 'computational' | 'misread';
  explanation?: string;
  hint?: string;
  reveal_solution?: boolean;
  worked_solution?: string;
}

export interface CoachSessionState {
  question: ExtractedQuestion;
  attempts: AttemptLog[];
  currentAttemptNumber: number;
  completed: boolean;
  masteryConfirmed: boolean;
  masteryQuestionAnswered: boolean;
  masteryFeedback?: string;
}

export interface FollowupScheduleItem {
  day: number;
  content: string;
}

export interface FollowupResponse {
  email_draft: string;
  schedule: FollowupScheduleItem[];
  classification: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface DocumentResponse {
  summary: string;
  insights: string[];
  data_points: ChartDataPoint[];
}

export interface SupportMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SupportResponse {
  response: string;
  escalate_to_human: boolean;
}

export interface LanguageResponse {
  corrected_text: string;
  explanation: string;
  vocabulary_suggestion: string;
  streak: number;
  xp: number;
}

