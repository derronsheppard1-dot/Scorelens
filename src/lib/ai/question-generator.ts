export const AI_SUBJECT_OPTIONS = [
  "Geography",
  "Environmental Science",
  "Social Studies",
  "Biology",
  "Chemistry",
  "Physics",
  "Mathematics",
  "English",
] as const;

export const AI_LEVEL_OPTIONS = [
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "CSEC",
  "CAPE",
  "Other",
] as const;

export const AI_DIFFICULTY_OPTIONS = [
  "Easy",
  "Medium",
  "Hard",
  "Mixed",
] as const;

export const AI_COGNITIVE_LEVEL_OPTIONS = [
  "Recall",
  "Understanding",
  "Application",
  "Analysis",
  "Mixed",
] as const;

export const AI_QUESTION_STYLE_OPTIONS = [
  "Standard MCQ",
  "Scenario-based",
  "Interpretation-based",
  "Data-response style",
  "Mixed",
] as const;

export type AiSubject = (typeof AI_SUBJECT_OPTIONS)[number];
export type AiLevel = (typeof AI_LEVEL_OPTIONS)[number];
export type AiDifficulty = (typeof AI_DIFFICULTY_OPTIONS)[number];
export type AiCognitiveLevel = (typeof AI_COGNITIVE_LEVEL_OPTIONS)[number];
export type AiQuestionStyle = (typeof AI_QUESTION_STYLE_OPTIONS)[number];

export type GenerateQuestionsRequest = {
  subject: string;
  level: string;
  topic: string;
  subtopic?: string;
  difficulty: AiDifficulty;
  cognitiveLevel?: AiCognitiveLevel;
  questionStyle?: AiQuestionStyle;
  count: number;
  preferCaribbeanContext?: boolean;
  additionalInstructions?: string;
};

export type GeneratedQuestion = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  subject: string;
  topic: string;
  level: string;
  subtopic?: string;
};

export type GenerateQuestionsResponse = {
  questions: GeneratedQuestion[];
};