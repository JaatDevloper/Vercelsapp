export interface Question {
  _id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category?: string;
  quiz_name?: string;
  quiz_id?: string;
  creator_id?: string;
  creator?: string;
  timer?: number;
  timestamp?: string;
}

export interface Quiz {
  _id: string;
  quiz_id?: string;
  title: string;
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
  timer?: number;
  negative_marking?: number;
  type?: string;
  creator_id?: string;
  creator_name?: string;
  created_at?: string;
  timestamp?: string;
  questionCount?: number;
  questions: Question[];
}

export interface QuizHistoryItem {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string;
}
