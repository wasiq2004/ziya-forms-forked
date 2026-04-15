import nodemailer from 'nodemailer';
import { getSmtpSettings } from '@/lib/mysql/platform';
import type { FormWithQuestions, ResponseWithAnswers } from '@/lib/types/database';

function formatAnswerValue(answer: ResponseWithAnswers['answers'][number]) {
  const answerText = answer.answer_text as unknown;

  if (answerText) {
    if (typeof answerText === 'string') {
      try {
        const parsed = JSON.parse(answerText);
        if (Array.isArray(parsed)) {
          return parsed.join(', ');
        }
      } catch {
        // ignore JSON parse errors and fall through to raw text
      }
      return answerText;
    }

    if (Array.isArray(answerText)) {
      return answerText.join(', ');
    }

    return String(answerText);
  }

  if (answer.answer_data && typeof answer.answer_data === 'object') {
    return Object.values(answer.answer_data).filter(Boolean).join(', ');
  }

  return '';
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildResponseRows(params: {
  form: FormWithQuestions;
  response: ResponseWithAnswers;
}) {
  return params.form.questions
    .map((question) => {
      const answer = params.response.answers.find(
        (item) => item.question_id === question.id
      );
      const value = formatAnswerValue(answer as any) || 'No answer';
      return `<tr><td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;font-weight:600;">${escapeHtml(question.title)}</td><td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;">${escapeHtml(value)}</td></tr>`;
    })
    .join('');
}

export async function sendResponseCopyEmail(params: {
  form: FormWithQuestions;
  respondentEmail: string;
  response: ResponseWithAnswers;
}) {
  const smtpSettings = await getSmtpSettings();
  if (!smtpSettings) {
    return { sent: false, reason: 'smtp_not_configured' as const };
  }

  const transporter = nodemailer.createTransport({
    host: smtpSettings.host,
    port: smtpSettings.port,
    secure: smtpSettings.port === 465 ? true : smtpSettings.secure,
    auth: {
      user: smtpSettings.user,
      pass: smtpSettings.password,
    },
  });

  const lines = [
    `Thank you for submitting "${params.form.title}".`,
    '',
    'Here is a copy of your response:',
    '',
    ...params.form.questions.map((question) => {
      const answer = params.response.answers.find(
        (item) => item.question_id === question.id
      );
      return `${question.title}: ${formatAnswerValue(answer as any) || 'No answer'}`;
    }),
  ];

  await transporter.sendMail({
    from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
    to: params.respondentEmail,
    subject: `Copy of your response: ${params.form.title}`,
    text: lines.join('\n'),
  });

  return { sent: true as const };
}

export async function sendAdminResponseNotificationEmail(params: {
  form: FormWithQuestions;
  response: ResponseWithAnswers; updatedExisting?: boolean;
}) {
  const smtpSettings = await getSmtpSettings();

  if (!smtpSettings || !smtpSettings.admin_email) {
    console.error('SMTP not configured or admin_email missing');
    return { sent: false, reason: 'notification_unavailable' as const };
  }

  if (!smtpSettings.host || !smtpSettings.user || !smtpSettings.password) {
    console.error('SMTP credentials missing:', {
      host: !!smtpSettings.host,
      user: !!smtpSettings.user,
      password: !!smtpSettings.password,
    });
    return { sent: false, reason: 'notification_unavailable' as const };
  }

  const transporter = nodemailer.createTransport({
    host: smtpSettings.host,
    port: smtpSettings.port,
    secure: smtpSettings.port === 465 ? true : smtpSettings.secure,
    auth: {
      user: smtpSettings.user,
      pass: smtpSettings.password,
    },
  });

  const submittedAt = new Date(params.response.submitted_at).toLocaleString();
  const source = params.response.submission_source || 'direct';
  const respondentEmail = params.response.respondent_email || 'Not collected';

  const subject = `${params.updatedExisting ? 'Updated response' : 'New response received'}: ${params.form.title}`;

  const textLines = [
    `${params.updatedExisting ? 'An existing response was updated' : 'A new response was received'} for "${params.form.title}".`,
    '',
    `Submitted at: ${submittedAt}`,
    `Source: ${source}`,
    `Respondent email: ${respondentEmail}`,
    '',
    'Answers:',
    ...params.form.questions.map((question) => {
      const answer = params.response.answers.find(
        (item) => item.question_id === question.id
      );
      return `- ${question.title}: ${formatAnswerValue(answer as any) || 'No answer'}`;
    }),
  ];

  const responseType = params.updatedExisting ? 'Updated response' : 'New response received';
  const htmlStart = `<div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px"><div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden"><div style="padding:24px;background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#fff"><h1 style="margin:0;font-size:24px">${escapeHtml(responseType)}</h1><p style="margin:8px 0 0;opacity:.9">${escapeHtml(params.form.title)}</p></div><div style="padding:24px"><p style="margin:0 0 12px"><strong>Submitted at:</strong> ${escapeHtml(submittedAt)}</p><p style="margin:0 0 12px"><strong>Source:</strong> ${escapeHtml(source)}</p><p style="margin:0 0 20px"><strong>Respondent email:</strong> ${escapeHtml(respondentEmail)}</p><table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><tbody>${buildResponseRows({form: params.form, response: params.response})}</tbody></table></div></div></div>`;

  await transporter.sendMail({
    from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
    to: smtpSettings.admin_email,
    subject,
    text: textLines.join('\n'),
    html: htmlStart,
  });

  return { sent: true as const };
}

export async function sendPasswordResetEmail(params: {
  email: string;
  otp: string;
}) {
  const smtpSettings = await getSmtpSettings();

  if (!smtpSettings) {
    console.error('SMTP not configured for password reset email');
    return { sent: false, reason: 'smtp_not_configured' as const };
  }

  const transporter = nodemailer.createTransport({
    host: smtpSettings.host,
    port: smtpSettings.port,
    secure: smtpSettings.port === 465 ? true : smtpSettings.secure,
    auth: {
      user: smtpSettings.from_email,
      pass: smtpSettings.password,
    },
  });

  const subject = 'Reset Your Ziya Forms Password';
  const text = `Your OTP for password reset is: ${params.otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you did not request a password reset, please ignore this email.`;

  const htmlContent = `<div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px"><div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden"><div style="padding:24px;background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#fff"><h1 style="margin:0;font-size:24px">Password Reset Request</h1><p style="margin:8px 0 0;opacity:.9">Ziya Forms</p></div><div style="padding:24px"><p style="margin:0 0 16px;color:#333">Hi there,</p><p style="margin:0 0 16px;color:#555">We received a request to reset your password. Use this 6 digit code to complete the process:</p><div style="background:#f0f4f8;border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center;margin:20px 0"><p style="margin:0;font-size:32px;font-weight:bold;letter-spacing:8px;color:#2563eb">${params.otp}</p></div><p style="margin:0 0 16px;color:#666;font-size:14px">This code will expire in 10 minutes.</p><p style="margin:0 0 16px;color:#666;font-size:14px">If you did not request a password reset, you can safely ignore this email.</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"><p style="margin:0;color:#999;font-size:12px">For security, never share this code with anyone.</p></div></div></div>`;

  try {
    await transporter.sendMail({
      from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
      to: params.email,
      subject,
      text,
      html: htmlContent,
    });

    return { sent: true as const };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { sent: false as const };
  }
}
