export type QuestionType =
  | 'short_answer'
  | 'paragraph'
  | 'multiple_choice'
  | 'checkboxes'
  | 'dropdown'
  | 'linear_scale'
  | 'file_upload';

export type EmailCollectionMode = 'off' | 'optional' | 'required';
export type ResponseCopyMode = 'off' | 'always';

export interface FormSettings {
  is_quiz?: boolean;
  collect_email_addresses?: EmailCollectionMode;
  send_response_copy?: ResponseCopyMode;
  notify_admin_on_response?: boolean;
  allow_response_editing?: boolean;
  limit_to_one_response?: boolean;
  show_progress_bar?: boolean;
  shuffle_question_order?: boolean;
  confirmation_message?: string;
  show_submit_another_response?: boolean;
  show_results_summary?: boolean;
  disable_autosave?: boolean;
  default_collect_email_addresses?: EmailCollectionMode;
  default_question_required?: boolean;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  status?: 'active' | 'inactive';
  role?: string;
  billing_plan?: 'free' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface Form {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  theme_color: string;
  banner_url?: string | null;
  settings?: FormSettings | null;
  is_published: boolean;
  is_accepting_responses: boolean;
  is_embedded?: boolean;
  created_at: string;
  updated_at: string;
  owner_plan?: 'free' | 'paid';
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
  points?: number;
  correctAnswer?: string;
  correctAnswers?: string[];
  feedbackCorrect?: string;
  feedbackIncorrect?: string;
}

export interface Response {
  id: string;
  form_id: string;
  respondent_email?: string;
  submission_source?: 'direct' | 'embed';
  edit_token?: string | null;
  quiz_score?: number | null;
  quiz_max_score?: number | null;
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

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalForms: number;
  embeddedForms: number;
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  role: string;
  billingPlan: 'free' | 'paid';
  formsCount: number;
  embeddedFormsCount: number;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string | null;
}

export interface AdminUserDetails extends AdminUserSummary {
  fullName?: string | null;
}

export interface TemplateForm {
  id: string;
  title: string;
  description?: string | null;
  questions: Array<Record<string, any>>;
  category?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SmtpSettings {
  id?: string;
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  from_email: string;
  from_name: string;
  admin_email: string;
  updated_at?: string;
}

export interface QuestionStats {
  question_id: string;
  question_title: string;
  question_type: QuestionType;
  responses: number;
  data: Record<string, any>;
}
