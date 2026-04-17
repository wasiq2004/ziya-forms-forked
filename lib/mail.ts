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

function buildResponseCopyCards(params: {
  form: FormWithQuestions;
  response: ResponseWithAnswers;
}) {
  return params.form.questions
    .map((question, index) => {
      const answer = params.response.answers.find(
        (item) => item.question_id === question.id
      );
      const value = formatAnswerValue(answer as any) || 'No answer';

      return `
        <tr>
          <td style="padding:0 0 16px;">
            <div style="border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;background:#ffffff;box-shadow:0 8px 24px rgba(15,23,42,0.04);">
              <div style="padding:16px 18px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">
                <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#0f172a;font-weight:700;">Question ${index + 1}</div>
                <div style="margin-top:6px;font-size:16px;line-height:1.4;color:#0f172a;font-weight:700;">${escapeHtml(question.title)}</div>
              </div>
              <div style="padding:18px;">
                <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:8px;">Your answer</div>
                <div style="font-size:15px;line-height:1.7;color:#111827;white-space:pre-wrap;">${escapeHtml(value)}</div>
              </div>
            </div>
          </td>
        </tr>
      `;
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

  const submittedAt = new Date(params.response.submitted_at).toLocaleString();
  const source = params.response.submission_source || 'direct';
  const responseCopyHtml = `
    <div style="margin:0;padding:0;background:#f8fafc;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your response for ${escapeHtml(params.form.title)} is ready.</div>
      <div style="max-width:760px;margin:0 auto;padding:32px 16px 40px;">
        <div style="border-radius:28px;overflow:hidden;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 24px 80px rgba(15,23,42,0.08);">
          <div style="padding:28px 28px 24px;background:linear-gradient(135deg,#2563eb 0%,#0ea5e9 55%,#14b8a6 100%);color:#ffffff;">
            <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,0.16);font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">
              Ziya Forms
            </div>
            <h1 style="margin:18px 0 8px;font-size:28px;line-height:1.15;font-weight:800;">Your response is saved</h1>
            <p style="margin:0;font-size:15px;line-height:1.7;max-width:560px;opacity:.95;">
              Thanks for submitting <strong>${escapeHtml(params.form.title)}</strong>. Below is a clean copy of everything you sent.
            </p>
          </div>

          <div style="padding:24px 28px 8px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:12px 0;">
              <tr>
                <td style="width:50%;padding:0 0 12px;">
                  <div style="border:1px solid #e5e7eb;border-radius:20px;padding:16px 18px;background:#f8fafc;">
                    <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#64748b;font-weight:700;">Form</div>
                    <div style="margin-top:6px;font-size:16px;font-weight:700;color:#0f172a;line-height:1.4;">${escapeHtml(params.form.title)}</div>
                  </div>
                </td>
                <td style="width:50%;padding:0 0 12px;">
                  <div style="border:1px solid #e5e7eb;border-radius:20px;padding:16px 18px;background:#f8fafc;">
                    <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#64748b;font-weight:700;">Submitted</div>
                    <div style="margin-top:6px;font-size:15px;font-weight:700;color:#0f172a;line-height:1.5;">${escapeHtml(submittedAt)}</div>
                  </div>
                </td>
              </tr>
            </table>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;">
              <tr>
                <td style="padding:8px 0 20px;">
                  <div style="border:1px solid #e5e7eb;border-radius:20px;padding:16px 18px;background:#ffffff;">
                    <div style="display:flex;gap:12px;flex-wrap:wrap;">
                      <div style="padding:8px 12px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:700;">Source: ${escapeHtml(source)}</div>
                      <div style="padding:8px 12px;border-radius:999px;background:#f0fdf4;color:#166534;font-size:12px;font-weight:700;">Recipient: ${escapeHtml(params.respondentEmail)}</div>
                    </div>
                  </div>
                </td>
              </tr>
            </table>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              ${buildResponseCopyCards({ form: params.form, response: params.response })}
            </table>

            <div style="padding:8px 0 12px;">
              <div style="border-radius:20px;padding:18px 20px;background:#f8fafc;border:1px dashed #cbd5e1;color:#475569;font-size:13px;line-height:1.7;">
                If anything looks incorrect, you can submit again or contact the form owner for help.
              </div>
            </div>
          </div>

          <div style="padding:18px 28px 28px;color:#94a3b8;font-size:12px;line-height:1.7;text-align:center;">
            Sent by Ziya Forms automatically after your submission.
          </div>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
    to: params.respondentEmail,
    subject: `Copy of your response: ${params.form.title}`,
    text: lines.join('\n'),
    html: responseCopyHtml,
  });

  return { sent: true as const };
}

export async function sendAdminResponseNotificationEmail(params: {
  form: FormWithQuestions;
  response: ResponseWithAnswers; updatedExisting?: boolean;
  recipientEmail?: string | null;
}) {
  const smtpSettings = await getSmtpSettings();

  const recipientEmail = (params.recipientEmail || smtpSettings?.admin_email || '').trim();

  if (!smtpSettings || !recipientEmail) {
    console.error('SMTP not configured or recipient email missing');
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
    to: recipientEmail,
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
      user: smtpSettings.user,
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
