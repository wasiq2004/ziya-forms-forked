export type QuestionType =
  | 'short_answer'
  | 'paragraph'
  | 'multiple_choice'
  | 'checkboxes'
  | 'dropdown'
  | 'linear_scale'
  | 'file_upload';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Form {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  theme_color: string;
  is_published: boolean;
  is_accepting_responses: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  form_id: string;
  title: string;
  description?: string;
  type: QuestionType;
  options: string[] | QuestionOption[];
  is_required: boolean;
  order_index: number;
  settings: QuestionSettings;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface QuestionSettings {
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  allowMultiple?: boolean;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
}

export interface Response {
  id: string;
  form_id: string;
  respondent_email?: string;
  submitted_at: string;
}

export interface Answer {
  id: string;
  response_id: string;
  question_id: string;
  answer_text?: string;
  answer_data: Record<string, any>;
  created_at: string;
}

export interface FormWithQuestions extends Form {
  questions: Question[];
}

export interface ResponseWithAnswers extends Response {
  answers: Answer[];
}

export interface FormAnalytics {
  form_id: string;
  total_responses: number;
  question_stats: QuestionStats[];
}

export interface QuestionStats {
  question_id: string;
  question_title: string;
  question_type: QuestionType;
  responses: number;
  data: Record<string, any>;
}
