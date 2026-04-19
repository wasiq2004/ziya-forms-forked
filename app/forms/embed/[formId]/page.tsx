'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { FormWithQuestions } from '@/lib/types/database';
import { CheckCircle, BarChart3, PencilLine, Repeat2 } from 'lucide-react';
import { useFormDraftAutosave } from '@/lib/useFormDraftAutosave';
import { shouldShowRespondentEmailField, requiresRespondentEmail } from '@/lib/form-settings';
import { apiFetch } from '@/lib/api';

export default function FormEmbedPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const formId = params?.formId as string;
  const editToken = searchParams.get('edit_token') || '';
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [form, setForm] = useState<FormWithQuestions | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [respondentEmail, setRespondentEmail] = useState('');
  const [editResponseToken, setEditResponseToken] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    maxScore: number;
    percentage: number;
    results: Array<{
      question_id: string;
      is_correct: boolean;
      points_awarded: number;
      points_possible: number;
      feedback?: string;
      correct_answer?: string;
    }>;
  } | null>(null);

  useEffect(() => {
    if (formId) {
      fetchForm();
    }
  }, [formId, editToken]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'resize' && iframeRef.current) {
        iframeRef.current.style.height = `${event.data.height + 30}px`;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchForm = async () => {
    try {
      const response = await apiFetch(`/api/forms/${formId}/public`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch form');
      }

      setForm(data.form);
      if (editToken) {
        await hydrateEditableResponse(editToken);
      }
    } catch (error) {
      console.error('Failed to fetch form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hydrateEditableResponse = async (token: string) => {
    try {
      const response = await apiFetch(`/api/forms/${formId}/response/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load editable response');
      }

      const answerState: Record<string, any> = {};
      data.response.answers?.forEach((answer: any) => {
        if (answer.answer_text) {
          try {
            const parsed = JSON.parse(answer.answer_text);
            answerState[answer.question_id] = parsed;
            return;
          } catch {
            answerState[answer.question_id] = answer.answer_text;
            return;
          }
        }

        answerState[answer.question_id] = answer.answer_data || '';
      });

      setAnswers(answerState);
      setRespondentEmail(data.response.respondent_email || '');
      setEditResponseToken(token);
    } catch (error) {
      console.error('Failed to hydrate editable response:', error);
    }
  };

  const displayQuestions = useMemo(() => {
    if (!form) return [];
    const questions = [...form.questions];
    if (!form.settings?.shuffle_question_order) {
      return questions;
    }

    return questions.sort(() => Math.random() - 0.5);
  }, [form]);

  const shouldCollectEmail = !!form && shouldShowRespondentEmailField(form.settings);
  const isEmailRequired = !!form && requiresRespondentEmail(form.settings);
  const answeredCount = Object.values(answers).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return String(value ?? '').trim().length > 0;
  }).length;
  const progressPercentage = displayQuestions.length > 0 ? Math.min(100, Math.round((answeredCount / displayQuestions.length) * 100)) : 0;

  const { clearDraft } = useFormDraftAutosave({
    formId,
    editToken: editToken || editResponseToken || null,
    disabled: !!form?.settings?.disable_autosave,
    submitSuccess,
    answers,
    respondentEmail,
    onRestore: ({ answers: restoredAnswers, respondentEmail: restoredEmail }) => {
      setAnswers(restoredAnswers);
      setRespondentEmail(restoredEmail || '');
    },
  });

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setIsSubmitting(true);

    try {
      const answersToSubmit = form.questions.map((question) => ({
        question_id: question.id,
        answer_text: answers[question.id] || '',
        answer_data: {},
      }));

      const response = await apiFetch(`/api/forms/${formId}/submit/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_data: {
            respondent_email: respondentEmail,
            submission_source: 'embed',
            edit_token: editResponseToken,
            answers: answersToSubmit,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit response');
      }

      setSubmitSuccess(true);
      if (data.edit_token) {
        setEditResponseToken(data.edit_token);
      }
      setQuizResult(
        form?.settings?.is_quiz
          ? {
              score: Number(data.quiz_score || 0),
              maxScore: Number(data.quiz_max_score || 0),
              percentage: Number(data.quiz_max_score) > 0 ? Math.round((Number(data.quiz_score || 0) / Number(data.quiz_max_score)) * 100) : 0,
              results: Array.isArray(data.quiz_results) ? data.quiz_results : [],
            }
          : null
      );

      if (window.parent) {
        const newHeight = document.body.scrollHeight;
        window.parent.postMessage({ type: 'resize', height: newHeight }, '*');
      }
    } catch (error) {
      console.error('Failed to submit response:', error);
      alert('Failed to submit response: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const sendHeight = () => {
      if (window.parent && !submitSuccess) {
        const newHeight = document.body.scrollHeight;
        window.parent.postMessage({ type: 'resize', height: newHeight }, '*');
      }
    };

    sendHeight();

    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [submitSuccess]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[color:var(--primary)]" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)]">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-[color:var(--foreground)]">Form Not Found</h1>
          <p className="text-[color:var(--muted-foreground)]">
            The form you&apos;re looking for doesn&apos;t exist or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (!form.is_published || !form.is_accepting_responses) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)]">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-[color:var(--foreground)]">Form Not Available</h1>
          <p className="text-[color:var(--muted-foreground)]">
            This form is not currently accepting responses.
          </p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)]">
        <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-8 text-center shadow-[0_24px_60px_rgba(15,23,42,0.1)]">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-[color:var(--status-success-text-light)]" />
          <h1 className="mb-4 text-2xl font-bold text-[color:var(--foreground)]">Response Submitted!</h1>
          <p className="mb-6 text-[color:var(--muted-foreground)]">
            {form.settings?.confirmation_message || 'Thank you for completing the form. Your response has been recorded.'}
          </p>
          {form.settings?.is_quiz && quizResult && (
            <div className="mb-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)] p-4 text-left">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">
                Quiz score: {quizResult.score} / {quizResult.maxScore} ({quizResult.percentage}%)
              </p>
              {quizResult.results.length > 0 && (
                <div className="mt-4 space-y-3">
                  {quizResult.results.map((item) => (
                    <div key={item.question_id} className="rounded-xl bg-[color:var(--card)] p-3">
                      <p className="text-sm font-medium text-[color:var(--foreground)]">
                        {item.is_correct ? 'Correct' : 'Incorrect'} - {item.points_awarded}/{item.points_possible}
                      </p>
                      {item.feedback && (
                        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">{item.feedback}</p>
                      )}
                      {!item.is_correct && item.correct_answer && (
                        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                          Correct answer: {item.correct_answer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col gap-3">
            {form.settings?.show_submit_another_response && (
              <Button
                onClick={() => {
                  setSubmitSuccess(false);
                  setAnswers({});
                  setRespondentEmail('');
                  setEditResponseToken(null);
                  setQuizResult(null);
                  clearDraft();
                }}
                variant="secondary"
                className="w-full"
              >
                <Repeat2 className="mr-2 h-4 w-4" />
                Submit another response
              </Button>
            )}

            {form.settings?.show_results_summary && (
              <Button
                onClick={() => window.open(`${window.location.origin}/form/${formId}/summary`, '_blank')}
                variant="outline"
                className="w-full"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                View results summary
              </Button>
            )}

            {form.settings?.allow_response_editing && editResponseToken && (
              <Button
                onClick={() => window.open(`${window.location.origin}/form/${formId}?edit_token=${editResponseToken}`, '_blank')}
                variant="ghost"
                className="w-full"
              >
                <PencilLine className="mr-2 h-4 w-4" />
                Edit response
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {form.settings?.show_progress_bar && (
          <div className="mb-4 overflow-hidden rounded-full border border-[color:var(--border)] bg-[color:var(--card)]">
            <div
              className="h-2 rounded-full bg-[color:var(--primary)]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        <div className="mb-6 overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-[0_24px_60px_rgba(15,23,42,0.1)]">
          {form.banner_url ? (
            <div className="h-52 w-full overflow-hidden bg-[color:var(--background)]">
              <img src={form.banner_url} alt={form.title} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-3 w-full" style={{ background: `linear-gradient(90deg, ${form.theme_color || '#2563eb'}, #0ea5e9)` }} />
          )}

          <div className="p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--primary)]">
              Embedded form
            </div>
            <h1 className="text-center text-3xl font-bold tracking-tight text-[color:var(--foreground)]">
              {form.title}
            </h1>
            {form.description && (
              <p className="mt-3 text-center text-[color:var(--muted-foreground)]">
                {form.description}
              </p>
            )}

            {shouldCollectEmail && (
              <div className="mt-8">
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-[color:var(--muted-foreground)]">
                  Your Email {isEmailRequired ? '(required)' : '(optional)'}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  placeholder="your@email.com"
                  required={isEmailRequired}
                />
                {form.settings?.limit_to_one_response && (
                  <p className="mt-2 text-xs text-[color:var(--muted-foreground)]">
                    Email addresses are used to limit responses to one submission.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {displayQuestions.map((question, index) => (
            <div
              key={question.id}
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm"
            >
              <div className="mb-4 h-1 w-24 rounded-full" style={{ background: form.theme_color || '#2563eb' }} />
              <div className="mb-4 flex items-start">
                <span className="mr-3 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--muted)] font-medium text-[color:var(--primary)]">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
                    {question.title}
                    {question.is_required && <span className="ml-1 text-red-500">*</span>}
                  </h3>
                  {question.description && (
                    <p className="mt-1 text-[color:var(--muted-foreground)]">
                      {question.description}
                    </p>
                  )}
                </div>
              </div>

              {question.type === 'short_answer' && (
                <Input
                  value={answers[question.id] || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAnswerChange(question.id, e.target.value)}
                  required={question.is_required}
                  placeholder="Your answer"
                />
              )}

              {question.type === 'paragraph' && (
                <Textarea
                  value={answers[question.id] || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleAnswerChange(question.id, e.target.value)}
                  required={question.is_required}
                  placeholder="Your answer"
                  rows={4}
                />
              )}

              {(question.type === 'multiple_choice' || question.type === 'dropdown') && (
                <div className="space-y-2">
                  {Array.isArray(question.options) && question.options.map((option: any, idx: number) => (
                    <div key={idx} className="flex items-center">
                      <input
                        type="radio"
                        id={`${question.id}-${idx}`}
                        name={question.id}
                        value={typeof option === 'string' ? option : option.value}
                        checked={answers[question.id] === (typeof option === 'string' ? option : option.value)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAnswerChange(question.id, e.target.value)}
                        required={question.is_required}
                        className="h-4 w-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                      />
                      <label htmlFor={`${question.id}-${idx}`} className="ml-3 block text-[color:var(--foreground)]">
                        {typeof option === 'string' ? option : option.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'checkboxes' && (
                <div className="space-y-2">
                  {Array.isArray(question.options) && question.options.map((option: any, idx: number) => (
                    <div key={idx} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${question.id}-${idx}`}
                        name={question.id}
                        value={typeof option === 'string' ? option : option.value}
                        checked={Array.isArray(answers[question.id]) && answers[question.id].includes(typeof option === 'string' ? option : option.value)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const currentValue = answers[question.id] || [];
                          if (e.target.checked) {
                            handleAnswerChange(question.id, [...currentValue, e.target.value]);
                          } else {
                            handleAnswerChange(question.id, currentValue.filter((v: string) => v !== e.target.value));
                          }
                        }}
                        className="h-4 w-4 rounded text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                      />
                      <label htmlFor={`${question.id}-${idx}`} className="ml-3 block text-[color:var(--foreground)]">
                        {typeof option === 'string' ? option : option.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-center">
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="px-8 py-3 text-white"
              style={{
                background: 'linear-gradient(to right, #2563eb, #0ea5e9)',
              }}
            >
              Submit
            </Button>
          </div>
        </form>

        {form.owner_plan !== 'paid' && (
          <div className="mt-8 text-center">
            <a
              href="https://ziyaforms.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] dark:hover:text-[color:var(--foreground)]"
            >
              Powered by Ziya Forms
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
