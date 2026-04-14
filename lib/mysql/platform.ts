import pool from './connection';
import { nanoid } from 'nanoid';
import { ensureAdminSchema } from './ensure-schema';
import type { SmtpSettings, TemplateForm } from '@/lib/types/database';

type TemplateRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  questions: any;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
};

const parseQuestions = (value: any) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
};

const mapTemplate = (row: TemplateRow): TemplateForm => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  questions: parseQuestions(row.questions),
  is_active: !!row.is_active,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export async function getPublicTemplates(): Promise<TemplateForm[]> {
  await ensureAdminSchema();
  const connection = await pool.getConnection();

  try {
    const [rows]: any = await connection.execute(
      `SELECT * FROM form_templates WHERE is_active = TRUE ORDER BY created_at DESC`
    );
    return rows.map(mapTemplate);
  } finally {
    connection.release();
  }
}

export async function getAllTemplates(): Promise<TemplateForm[]> {
  await ensureAdminSchema();
  const connection = await pool.getConnection();

  try {
    const [rows]: any = await connection.execute(
      `SELECT * FROM form_templates ORDER BY created_at DESC`
    );
    return rows.map(mapTemplate);
  } finally {
    connection.release();
  }
}

export async function getTemplateById(id: string): Promise<TemplateForm | null> {
  await ensureAdminSchema();
  const connection = await pool.getConnection();

  try {
    const [rows]: any = await connection.execute(
      `SELECT * FROM form_templates WHERE id = ? LIMIT 1`,
      [id]
    );
    const row = rows[0];
    return row ? mapTemplate(row) : null;
  } finally {
    connection.release();
  }
}

export async function createTemplate(template: {
  title: string;
  description?: string;
  category?: string;
  questions?: Array<Record<string, any>>;
}) {
  await ensureAdminSchema();
  const connection = await pool.getConnection();
  const id = nanoid();

  try {
    await connection.execute(
      `INSERT INTO form_templates (id, title, description, category, questions, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [
        id,
        template.title,
        template.description || null,
        template.category || null,
        JSON.stringify(template.questions || []),
      ]
    );

    return await getTemplateById(id);
  } finally {
    connection.release();
  }
}

export async function updateTemplate(id: string, template: Partial<{
  title: string;
  description: string | null;
  category: string | null;
  questions: Array<Record<string, any>>;
  is_active: boolean;
}>) {
  await ensureAdminSchema();
  const connection = await pool.getConnection();

  try {
    const fields: string[] = [];
    const values: any[] = [];

    if (template.title !== undefined) {
      fields.push('title = ?');
      values.push(template.title);
    }

    if (template.description !== undefined) {
      fields.push('description = ?');
      values.push(template.description);
    }

    if (template.category !== undefined) {
      fields.push('category = ?');
      values.push(template.category);
    }

    if (template.questions !== undefined) {
      fields.push('questions = ?');
      values.push(JSON.stringify(template.questions));
    }

    if (template.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(template.is_active);
    }

    if (!fields.length) {
      return false;
    }

    values.push(id);

    const [result]: any = await connection.execute(
      `UPDATE form_templates SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
}

export async function deleteTemplate(id: string) {
  await ensureAdminSchema();
  const connection = await pool.getConnection();

  try {
    const [result]: any = await connection.execute(
      `DELETE FROM form_templates WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
}

export async function getSmtpSettings(): Promise<SmtpSettings | null> {
  await ensureAdminSchema();
  const connection = await pool.getConnection();

  try {
    const [rows]: any = await connection.execute(
      `SELECT * FROM smtp_settings ORDER BY updated_at DESC LIMIT 1`
    );
    const row = rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      host: (row.host || '').trim(),
      port: Number(row.port),
      user: (row.user || '').trim(),
      password: (row.password || '').trim(),
      secure: !!row.secure,
      from_email: (row.from_email || '').trim(),
      from_name: (row.from_name || '').trim(),
      admin_email: (row.admin_email || '').trim(),
      updated_at: row.updated_at,
    };
  } finally {
    connection.release();
  }
}

export async function saveSmtpSettings(settings: SmtpSettings) {
  await ensureAdminSchema();
  const connection = await pool.getConnection();

  try {
    const existing = await getSmtpSettings();

    if (!existing) {
      const [result]: any = await connection.execute(
        `INSERT INTO smtp_settings (host, port, user, password, secure, from_email, from_name, admin_email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          settings.host,
          settings.port,
          settings.user,
          settings.password,
          settings.secure,
          settings.from_email,
          settings.from_name,
          settings.admin_email,
        ]
      );
      return result.affectedRows > 0;
    }

    const [result]: any = await connection.execute(
      `UPDATE smtp_settings
       SET host = ?, port = ?, user = ?, password = ?, secure = ?, from_email = ?, from_name = ?, admin_email = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        settings.host,
        settings.port,
        settings.user,
        settings.password,
        settings.secure,
        settings.from_email,
        settings.from_name,
        settings.admin_email,
        existing.id,
      ]
    );

    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
}

export async function getSuperAdminEmail(): Promise<string | null> {
  await ensureAdminSchema();
  const connection = await pool.getConnection();

  try {
    const [rows]: any = await connection.execute(
      `SELECT email FROM users WHERE role = 'super_admin' ORDER BY created_at ASC LIMIT 1`
    );

    const row = rows[0];
    return row?.email || null;
  } finally {
    connection.release();
  }
}
