import { nanoid } from 'nanoid';
import type { FormWithQuestions } from '@/lib/types/database';
import { normalizeFormSettings, requiresRespondentEmail, getResponseCopyMode } from '@/lib/form-settings';
import { calculateQuizScore } from '@/lib/forms/quiz';
import {
  createAnswer,
  createResponse,
  getResponseByEditToken,
  getResponseByEmail,
  getUserById,
  replaceAnswersForResponse,
  updateResponseEmailAndSource,
  updateResponseQuizScore,
} from '@/lib/mysql/utils';
import { sendAdminResponseNotificationEmail, sendResponseCopyEmail } from '@/lib/mail';

export type SubmissionSource = 'direct' | 'embed';

export interface FormSubmissionAnswer {
  question_id: string;
  answer_text?: string;
  answer_data?: Record<string, any>;
}

export interface FormSubmissionData {
  respondent_email?: string | null;
  submission_source?: SubmissionSource;
  answers?: FormSubmissionAnswer[];
  edit_token?: string | null;
}

export interface FormSubmissionResult {
  response_id: string;
  edit_token?: string | null;
  updated_existing: boolean;
  quiz_score?: number | null;
  quiz_max_score?: number | null;
  quiz_percentage?: number | null;
  quiz_results?: ReturnType<typeof calculateQuizScore>['results'];
}

export async function saveFormSubmission(form: FormWithQuestions, responseData: FormSubmissionData): Promise<FormSubmissionResult> {
  const settings = normalizeFormSettings(form.settings);
  const respondentEmail = (responseData.respondent_email || '').trim();
  const answers = Array.isArray(responseData.answers) ? responseData.answers : [];
  const submissionSource = responseData.submission_source || 'direct';
  const editToken = responseData.edit_token || null;

  if (requiresRespondentEmail(settings) && !respondentEmail) {
    throw new Error('An email address is required for this form.');
  }

  if (settings.limit_to_one_response && respondentEmail) {
    const existing = await getResponseByEmail(form.id, respondentEmail);
    if (existing && !editToken) {
      throw new Error('This email has already submitted a response for this form.');
    }
  }

  let responseId: string;
  let createdEditToken: string | null = null;
  let updatedExisting = false;
  let quizResult: ReturnType<typeof calculateQuizScore> | null = null;

  if (settings.is_quiz) {
    quizResult = calculateQuizScore(form, answers);
  }

  const enrichedAnswers = answers.map((answer) => {
    if (!quizResult || !settings.is_quiz) {
      return answer;
    }

    const quizQuestion = quizResult.results.find((item) => item.question_id === answer.question_id);
    return {
      ...answer,
      answer_data: {
        ...(answer.answer_data || {}),
        is_correct: quizQuestion?.is_correct || false,
        points_awarded: quizQuestion?.points_awarded || 0,
        points_possible: quizQuestion?.points_possible || 0,
        correct_answer: quizQuestion?.correct_answer || '',
      },
    };
  });

  if (editToken) {
    const existingResponse = await getResponseByEditToken(form.id, editToken);
    if (!existingResponse) {
      throw new Error('Editable response not found.');
    }

    responseId = existingResponse.id;
    updatedExisting = true;
    await updateResponseEmailAndSource(responseId, {
      respondent_email: respondentEmail || null,
      submission_source: submissionSource,
    });
    await replaceAnswersForResponse(responseId, enrichedAnswers);
  } else {
    createdEditToken = settings.allow_response_editing ? nanoid(24) : null;
    const response = await createResponse({
      form_id: form.id,
      respondent_email: respondentEmail || null,
      submission_source: submissionSource,
      edit_token: createdEditToken,
      quiz_score: quizResult?.score ?? null,
      quiz_max_score: quizResult?.maxScore ?? null,
    });

    responseId = response.id;

    for (const answer of enrichedAnswers) {
      await createAnswer({
        response_id: responseId,
        question_id: answer.question_id,
        answer_text: answer.answer_text || '',
        answer_data: answer.answer_data || {},
      });
    }
  }

  const savedResponse = {
    id: responseId,
    form_id: form.id,
    respondent_email: respondentEmail || null,
    submission_source: submissionSource,
    edit_token: createdEditToken || editToken || null,
    quiz_score: quizResult?.score ?? null,
    quiz_max_score: quizResult?.maxScore ?? null,
    answers: enrichedAnswers,
    submitted_at: new Date().toISOString(),
  };

  if (quizResult) {
    await updateResponseQuizScore(responseId, quizResult.score, quizResult.maxScore);
  }

  if (settings.notify_admin_on_response) {
    const ownerRecord = form.owner_email ? null : await getUserById(form.user_id);
    const responseRecipientEmail = (form.owner_email || ownerRecord?.email || '').trim() || null;
    try {
      await sendAdminResponseNotificationEmail({
        form,
        response: savedResponse as any,
        updatedExisting,
        recipientEmail: responseRecipientEmail,
      });
    } catch (error) {
      console.error('Failed to send admin notification email:', error);
    }
  }

  const shouldSendRespondentCopy =
    respondentEmail &&
    (getResponseCopyMode(settings) === 'always' || settings.notify_admin_on_response);

  if (shouldSendRespondentCopy) {
    try {
      await sendResponseCopyEmail({
        form,
        respondentEmail,
        response: savedResponse as any,
      });
    } catch (error) {
      console.error('Failed to send response copy email:', error);
    }
  }

  return {
    response_id: responseId,
    edit_token: createdEditToken || editToken || null,
    updated_existing: updatedExisting,
    quiz_score: quizResult?.score ?? null,
    quiz_max_score: quizResult?.maxScore ?? null,
    quiz_results: quizResult?.results,
  };
}
