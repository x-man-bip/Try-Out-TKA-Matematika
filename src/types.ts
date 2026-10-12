export type Choice = "A" | "B" | "C" | "D" | "E";

export type QuestionType = "single-choice" | "multiple-choice" | "true-false";

export interface Question {
  id: number;
  question_type: QuestionType;
  subject: string;
  question: string;
  image_url?: string | null;
  choices: Record<string, string>;
  answer: string; // "A" for single/true-false, "A,C" for multiple-choice
}

export type Answers = Record<number, string>; // questionId -> "A" or "A,C"

export type QuestionStatus = "answered" | "unanswered" | "current";

export type ExamState = "register" | "exam" | "result";

export interface Participant {
  name: string;
  school: string;
  code: string;
  class: string;
}

export function formatScore(score: number): string {
  return score.toFixed(2).replace(".", ",");
}
