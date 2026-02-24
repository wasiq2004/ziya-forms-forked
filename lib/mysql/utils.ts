import pool from './connection';
import { nanoid } from 'nanoid';

// Utility functions for MySQL operations

export async function createUser(userData: { 
  id?: string; 
  email: string; 
  full_name?: string; 
  password_hash?: string;
  avatar_url?: string;
}) {
  const userId = userData.id || nanoid();
  const connection = await pool.getConnection();
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO users (id, email, full_name, password_hash, avatar_url) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        userData.email,
        userData.full_name || null,
        userData.password_hash || null,
        userData.avatar_url || null
      ]
    );
    
    return { id: userId, ...userData };
  } finally {
    connection.release();
  }
}

export async function getUserByEmail(email: string) {
  const connection = await pool.getConnection();
  
  try {
    const [rows]: any = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    return rows[0] || null;
  } finally {
    connection.release();
  }
}

export async function getUserById(id: string) {
  const connection = await pool.getConnection();
  
  try {
    const [rows]: any = await connection.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    return rows[0] || null;
  } finally {
    connection.release();
  }
}

export async function updateUser(id: string, userData: Partial<{
  full_name: string;
  avatar_url: string;
}>) {
  const connection = await pool.getConnection();
  
  try {
    const fields = [];
    const values = [];
    
    if (userData.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(userData.full_name);
    }
    
    if (userData.avatar_url !== undefined) {
      fields.push('avatar_url = ?');
      values.push(userData.avatar_url);
    }
    
    if (fields.length === 0) {
      return null;
    }
    
    values.push(id);
    
    const [result]: any = await connection.execute(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
}

export async function createForm(formData: {
  id?: string;
  user_id: string;
  title: string;
  description?: string;
  theme_color?: string;
  is_published?: boolean;
  is_accepting_responses?: boolean;
}) {
  const formId = formData.id || nanoid();
  const connection = await pool.getConnection();
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO forms (id, user_id, title, description, theme_color, is_published, is_accepting_responses)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        formId,
        formData.user_id,
        formData.title,
        formData.description || null,
        formData.theme_color || '#3b82f6',
        formData.is_published || false,
        formData.is_accepting_responses || true
      ]
    );
    
    return {
      id: formId,
      ...formData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } finally {
    connection.release();
  }
}

export async function getFormsByUserId(userId: string) {
  const connection = await pool.getConnection();
  
  try {
    const [rows]: any = await connection.execute(
      'SELECT * FROM forms WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    return rows;
  } finally {
    connection.release();
  }
}

export async function getFormById(id: string) {
  const connection = await pool.getConnection();
  
  try {
    const [rows]: any = await connection.execute(
      'SELECT * FROM forms WHERE id = ?',
      [id]
    );
    
    return rows[0] || null;
  } finally {
    connection.release();
  }
}

export async function getFormWithQuestions(id: string) {
  const connection = await pool.getConnection();
  
  try {
    // Get the form
    const [formRows]: any = await connection.execute(
      'SELECT * FROM forms WHERE id = ?',
      [id]
    );
    
    const form = formRows[0];
    if (!form) return null;
    
    // Get questions for this form
    const [questionRows]: any = await connection.execute(
      'SELECT * FROM questions WHERE form_id = ? ORDER BY order_index ASC',
      [id]
    );
    
    return {
      ...form,
      questions: questionRows
    };
  } finally {
    connection.release();
  }
}

export async function updateForm(id: string, formData: Partial<{
  title: string;
  description: string;
  theme_color: string;
  is_published: boolean;
  is_accepting_responses: boolean;
}>) {
  const connection = await pool.getConnection();
  
  try {
    const fields = [];
    const values = [];
    
    if (formData.title !== undefined) {
      fields.push('title = ?');
      values.push(formData.title);
    }
    
    if (formData.description !== undefined) {
      fields.push('description = ?');
      values.push(formData.description);
    }
    
    if (formData.theme_color !== undefined) {
      fields.push('theme_color = ?');
      values.push(formData.theme_color);
    }
    
    if (formData.is_published !== undefined) {
      fields.push('is_published = ?');
      values.push(formData.is_published);
    }
    
    if (formData.is_accepting_responses !== undefined) {
      fields.push('is_accepting_responses = ?');
      values.push(formData.is_accepting_responses);
    }
    
    if (fields.length === 0) {
      return null;
    }
    
    values.push(id);
    
    const [result]: any = await connection.execute(
      `UPDATE forms SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
}

export async function deleteForm(id: string) {
  const connection = await pool.getConnection();
  
  try {
    const [result]: any = await connection.execute(
      'DELETE FROM forms WHERE id = ?',
      [id]
    );
    
    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
}

export async function createQuestion(questionData: {
  id?: string;
  form_id: string;
  title: string;
  description?: string;
  type: string;
  options?: any[];
  is_required?: boolean;
  order_index?: number;
  settings?: any;
}) {
  const questionId = questionData.id || nanoid();
  const connection = await pool.getConnection();
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO questions (id, form_id, title, description, type, options, is_required, order_index, settings)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        questionId,
        questionData.form_id,
        questionData.title,
        questionData.description || null,
        questionData.type,
        JSON.stringify(questionData.options || []),
        questionData.is_required !== undefined ? questionData.is_required : true,
        questionData.order_index !== undefined ? questionData.order_index : 0,
        JSON.stringify(questionData.settings || {})
      ]
    );
    
    return {
      id: questionId,
      ...questionData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } finally {
    connection.release();
  }
}

export async function getQuestionsByFormId(formId: string) {
  const connection = await pool.getConnection();
  
  try {
    const [rows]: any = await connection.execute(
      'SELECT * FROM questions WHERE form_id = ? ORDER BY order_index ASC',
      [formId]
    );
    
    // Parse JSON fields
    return rows.map((row: any) => ({
      ...row,
      options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings
    }));
  } finally {
    connection.release();
  }
}

export async function createResponse(responseData: {
  id?: string;
  form_id: string;
  respondent_email?: string;
}) {
  const responseId = responseData.id || nanoid();
  const connection = await pool.getConnection();
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO responses (id, form_id, respondent_email)
       VALUES (?, ?, ?)`,
      [
        responseId,
        responseData.form_id,
        responseData.respondent_email || null
      ]
    );
    
    return {
      id: responseId,
      ...responseData,
      submitted_at: new Date().toISOString()
    };
  } finally {
    connection.release();
  }
}

export async function createAnswer(answerData: {
  id?: string;
  response_id: string;
  question_id: string;
  answer_text?: string;
  answer_data?: any;
}) {
  const answerId = answerData.id || nanoid();
  const connection = await pool.getConnection();
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO answers (id, response_id, question_id, answer_text, answer_data)
       VALUES (?, ?, ?, ?, ?)`,
      [
        answerId,
        answerData.response_id,
        answerData.question_id,
        answerData.answer_text || null,
        JSON.stringify(answerData.answer_data || {})
      ]
    );
    
    return {
      id: answerId,
      ...answerData,
      created_at: new Date().toISOString()
    };
  } finally {
    connection.release();
  }
}

export async function getResponsesWithAnswers(formId: string) {
  const connection = await pool.getConnection();
  
  try {
    // Get responses
    const [responseRows]: any = await connection.execute(
      `SELECT * FROM responses WHERE form_id = ? ORDER BY submitted_at DESC`,
      [formId]
    );
    
    // Get all answers for these responses
    if (responseRows.length > 0) {
      const responseIds = responseRows.map((r: any) => r.id);
      const placeholders = responseIds.map(() => '?').join(',');
      
      const [answerRows]: any = await connection.execute(
        `SELECT * FROM answers WHERE response_id IN (${placeholders})`,
        responseIds
      );
      
      // Group answers by response_id
      const answersByResponse: any = {};
      answerRows.forEach((answer: any) => {
        if (!answersByResponse[answer.response_id]) {
          answersByResponse[answer.response_id] = [];
        }
        // Parse JSON fields
        answersByResponse[answer.response_id].push({
          ...answer,
          answer_data: typeof answer.answer_data === 'string' ? JSON.parse(answer.answer_data) : answer.answer_data
        });
      });
      
      // Attach answers to responses
      return responseRows.map((response: any) => ({
        ...response,
        answers: answersByResponse[response.id] || []
      }));
    }
    
    return responseRows;
  } finally {
    connection.release();
  }
}

export async function getFormQuestions(formId: string) {
  const connection = await pool.getConnection();
  
  try {
    const [rows]: any = await connection.execute(
      'SELECT * FROM questions WHERE form_id = ? ORDER BY order_index ASC',
      [formId]
    );
    
    // Parse JSON fields
    return rows.map((row: any) => ({
      ...row,
      options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings
    }));
  } finally {
    connection.release();
  }
}