-- MySQL Schema for Ziya Forms Application

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS ziya_forms;
USE ziya_forms;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  password_hash VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Forms table
CREATE TABLE IF NOT EXISTS forms (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  theme_color VARCHAR(7) DEFAULT '#3b82f6',
  is_published BOOLEAN DEFAULT FALSE,
  is_accepting_responses BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(36) PRIMARY KEY,
  form_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('short_answer', 'paragraph', 'multiple_choice', 'checkboxes', 'dropdown', 'linear_scale', 'file_upload') NOT NULL,
  options JSON,
  is_required BOOLEAN DEFAULT TRUE,
  order_index INT DEFAULT 0,
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
  id VARCHAR(36) PRIMARY KEY,
  form_id VARCHAR(36) NOT NULL,
  respondent_email VARCHAR(255),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
  id VARCHAR(36) PRIMARY KEY,
  response_id VARCHAR(36) NOT NULL,
  question_id VARCHAR(36) NOT NULL,
  answer_text TEXT,
  answer_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_forms_user_id ON forms(user_id);
CREATE INDEX idx_questions_form_id ON questions(form_id);
CREATE INDEX idx_responses_form_id ON responses(form_id);
CREATE INDEX idx_answers_response_id ON answers(response_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);