import pool from './connection';
import { ensureAdminSchema } from './ensure-schema';
import { nanoid } from 'nanoid';
import { normalizeFormSettings, DEFAULT_FORM_SETTINGS } from '@/lib/form-settings';

// Utility functions for MySQL operations

export async function createUser(userData: { 
  id?: string; 
  email: string; 
  full_name?: string; 
  password_hash?: string;
  avatar_url?: string;
  status?: 'active' | 'inactive';
  role?: string;
  billing_plan?: 'free' | 'paid';
}) {
  const userId = userData.id || nanoid();
  await ensureAdminSchema();
  const connection = await pool.getConnection();
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO users (id, email, full_name, password_hash, avatar_url, status, role, billing_plan) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        userData.email,
        userData.full_name || null,
        userData.password_hash || null,
        userData.avatar_url || null,
        userData.status || 'active',
        userData.role || 'user',
        userData.billing_plan || 'free'
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
  status: 'active' | 'inactive';
  role: string;
  billing_plan: 'free' | 'paid';
}>) {
  await ensureAdminSchema();
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

    if (userData.status !== undefined) {
      fields.push('status = ?');
      values.push(userData.status);
    }

    if (userData.role !== undefined) {
      fields.push('role = ?');
      values.push(userData.role);
    }

    if (userData.billing_plan !== undefined) {
      fields.push('billing_plan = ?');
      values.push(userData.billing_plan);
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
  banner_url?: string | null;
  settings?: Record<string, any> | null;
  is_published?: boolean;
  is_accepting_responses?: boolean;
  is_embedded?: boolean;
}) {
  const formId = formData.id || nanoid();
  await ensureAdminSchema();
  const connection = await pool.getConnection();
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO forms (id, user_id, title, description, theme_color, banner_url, settings, is_published, is_accepting_responses, is_embedded)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        formId,
        formData.user_id,
        formData.title,
        formData.description || null,
        formData.theme_color || '#3b82f6',
        formData.banner_url || null,
        JSON.stringify(normalizeFormSettings(formData.settings || DEFAULT_FORM_SETTINGS)),
        formData.is_published || false,
        formData.is_accepting_responses !== undefined ? formData.is_accepting_responses : true,
        formData.is_embedded || false
      ]
    );
    
    return {
      id: formId,
      ...formData,
      settings: normalizeFormSettings(formData.settings || DEFAULT_FORM_SETTINGS),
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
    
    return rows.map((row: any) => ({
      ...row,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
    }));
  } finally {
    connection.release();
  }
}

export async function getFormById(id: string) {
  const connection = await pool.getConnection();
  
  try {
    const [rows]: any = await connection.execute(
      `SELECT f.*, COALESCE(u.billing_plan, 'free') AS owner_plan
       FROM forms f
       INNER JOIN users u ON u.id = f.user_id
       WHERE f.id = ?`,
      [id]
    );
    
    const row = rows[0];
    if (!row) return null;
    return {
      ...row,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
    };
  } finally {
    connection.release();
  }
}

export async function getFormWithQuestions(id: string) {
  const connection = await pool.getConnection();
  
  try {
    // Get the form
    const [formRows]: any = await connection.execute(
      `SELECT f.*, COALESCE(u.billing_plan, 'free') AS owner_plan, u.email AS owner_email
       FROM forms f
       INNER JOIN users u ON u.id = f.user_id
       WHERE f.id = ?`,
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
      settings: typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings,
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
  banner_url: string | null;
  settings: Record<string, any> | null;
  is_published: boolean;
  is_accepting_responses: boolean;
  is_embedded: boolean;
}>) {
  await ensureAdminSchema();
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

    if (formData.banner_url !== undefined) {
      fields.push('banner_url = ?');
      values.push(formData.banner_url);
    }

    if (formData.settings !== undefined) {
      fields.push('settings = ?');
      values.push(JSON.stringify(normalizeFormSettings(formData.settings)));
    }
    
    if (formData.is_published !== undefined) {
      fields.push('is_published = ?');
      values.push(formData.is_published);
    }
    
    if (formData.is_accepting_responses !== undefined) {
      fields.push('is_accepting_responses = ?');
      values.push(formData.is_accepting_responses);
    }

    if (formData.is_embedded !== undefined) {
      fields.push('is_embedded = ?');
      values.push(formData.is_embedded);
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
  respondent_email?: string | null;
  submission_source?: 'direct' | 'embed';
  edit_token?: string | null;
  quiz_score?: number | null;
  quiz_max_score?: number | null;
}) {
  const responseId = responseData.id || nanoid();
  await ensureAdminSchema();
  const connection = await pool.getConnection();
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO responses (id, form_id, respondent_email, submission_source, edit_token, quiz_score, quiz_max_score)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        responseId,
        responseData.form_id,
        responseData.respondent_email || null,
        responseData.submission_source || 'direct',
        responseData.edit_token || null,
        responseData.quiz_score ?? null,
        responseData.quiz_max_score ?? null,
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

export async function getResponseByEditToken(formId: string, editToken: string) {
  const connection = await pool.getConnection();

  try {
    const [rows]: any = await connection.execute(
      `SELECT * FROM responses WHERE form_id = ? AND edit_token = ? LIMIT 1`,
      [formId, editToken]
    );

    return rows[0] || null;
  } finally {
    connection.release();
  }
}

export async function getResponseByEmail(formId: string, respondentEmail: string) {
  const connection = await pool.getConnection();

  try {
    const [rows]: any = await connection.execute(
      `SELECT * FROM responses WHERE form_id = ? AND LOWER(respondent_email) = LOWER(?) LIMIT 1`,
      [formId, respondentEmail]
    );

    return rows[0] || null;
  } finally {
    connection.release();
  }
}

export async function replaceAnswersForResponse(responseId: string, answers: Array<{
  question_id: string;
  answer_text?: string;
  answer_data?: any;
}>) {
  const connection = await pool.getConnection();

  try {
    await connection.execute('DELETE FROM answers WHERE response_id = ?', [responseId]);

    for (const answer of answers) {
      const answerText =
        typeof answer.answer_text === 'string'
          ? answer.answer_text
          : answer.answer_text !== undefined && answer.answer_text !== null
            ? JSON.stringify(answer.answer_text)
            : null;

      await connection.execute(
        `INSERT INTO answers (id, response_id, question_id, answer_text, answer_data)
         VALUES (?, ?, ?, ?, ?)`,
        [
          nanoid(),
          responseId,
          answer.question_id,
          answerText,
          JSON.stringify(answer.answer_data || {}),
        ]
      );
    }

    return true;
  } finally {
    connection.release();
  }
}

export async function updateResponseEmailAndSource(responseId: string, data: {
  respondent_email?: string | null;
  submission_source?: 'direct' | 'embed';
}) {
  const connection = await pool.getConnection();

  try {
    const [result]: any = await connection.execute(
      `UPDATE responses SET respondent_email = ?, submission_source = ? WHERE id = ?`,
      [data.respondent_email || null, data.submission_source || 'direct', responseId]
    );

    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
}

export async function updateResponseQuizScore(responseId: string, quizScore: number | null, quizMaxScore: number | null) {
  const connection = await pool.getConnection();

  try {
    const [result]: any = await connection.execute(
      `UPDATE responses SET quiz_score = ?, quiz_max_score = ? WHERE id = ?`,
      [quizScore, quizMaxScore, responseId]
    );

    return result.affectedRows > 0;
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
  const answerText =
    typeof answerData.answer_text === 'string'
      ? answerData.answer_text
      : answerData.answer_text !== undefined && answerData.answer_text !== null
        ? JSON.stringify(answerData.answer_text)
        : null;
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO answers (id, response_id, question_id, answer_text, answer_data)
       VALUES (?, ?, ?, ?, ?)`,
      [
        answerId,
        answerData.response_id,
        answerData.question_id,
        answerText,
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
