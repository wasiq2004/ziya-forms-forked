'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BarChart3, Filter, ShieldCheck, FileText } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { FormWithQuestions, ResponseWithAnswers } from '@/lib/types/database';
import { GRADIENT_COLORS } from '@/lib/config';
import FormHeader from '@/components/ui/FormHeader';
import { apiFetch, getApiUrl } from '@/lib/api';

type SourceFilter = 'all' | 'direct' | 'embed';

const SOURCE_LABELS: Record<Exclude<SourceFilter, 'all'>, string> = {
  direct: 'Direct form',
  embed: 'Embed code',
};

const escapeCsvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export default function ResponsesPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params?.formId as string;
  const { data: session, status } = useSession();

  const [form, setForm] = useState<FormWithQuestions | null>(null);
  const [responses, setResponses] = useState<ResponseWithAnswers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'individual'>('summary');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (formId) {
      fetchData();
    }
  }, [formId, session, status, router]);

  const fetchData = async () => {
    try {
      const [formRes, responsesRes] = await Promise.all([
        apiFetch(`/api/forms/${formId}`),
        apiFetch(`/api/responses/${formId}`),
      ]);

      const formData = await formRes.json();
      const responsesData = await responsesRes.json();

      setForm(formData.form);
      setResponses(responsesData.responses || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setResponses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResponses = useMemo(() => {
    if (sourceFilter === 'all') {
      return responses;
    }

    return responses.filter((response) => (response.submission_source || 'direct') === sourceFilter);
  }, [responses, sourceFilter]);

  const directResponses = responses.filter((response) => (response.submission_source || 'direct') === 'direct');
  const embedResponses = responses.filter((response) => response.submission_source === 'embed');

  const statsSummary = useMemo(() => {
    const latestResponse = filteredResponses[0];

    return [
      { label: 'Total', value: filteredResponses.length.toString(), tone: 'bg-[color:var(--primary)]/10 text-[color:var(--primary)]' },
      { label: 'Direct form', value: directResponses.length.toString(), tone: 'bg-[color:var(--primary)]/10 text-[color:var(--primary)]'},
      { label: 'Embed code', value: embedResponses.length.toString(), tone: 'bg-[color:var(--primary)]/10 text-[color:var(--primary)]' },
      { label: 'Latest', value: latestResponse ? new Date(latestResponse.submitted_at).toLocaleDateString() : 'None', tone: 'bg-[color:var(--primary)]/10 text-[color:var(--primary)]' },
    ];
  }, [directResponses.length, embedResponses.length, filteredResponses]);

  const exportToCSV = () => {
    if (!form || filteredResponses.length === 0) return;

    const headers = ['Timestamp', 'Submission Source', 'Respondent Email', 'Quiz Score', 'Quiz Max Score', ...form.questions.map((q) => q.title)].map(escapeCsvCell);
    const rows = filteredResponses.map((response) => {
      const row = [
        escapeCsvCell(new Date(response.submitted_at).toLocaleString()),
        escapeCsvCell(SOURCE_LABELS[(response.submission_source || 'direct') as Exclude<SourceFilter, 'all'>] || 'Direct form'),
        escapeCsvCell(response.respondent_email || ''),
        escapeCsvCell(response.quiz_score ?? ''),
        escapeCsvCell(response.quiz_max_score ?? ''),
      ];

      form.questions.forEach((question) => {
        const answer = response.answers?.find((a) => a.question_id === question.id);
        row.push(escapeCsvCell(answer?.answer_text || JSON.stringify(answer?.answer_data || '')));
      });

      return row.join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.title}-responses.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    window.open(getApiUrl(`/api/responses/${formId}/export`), '_blank');
  };

  const getQuestionStats = (questionId: string) => {
    const question = form?.questions.find((q) => q.id === questionId);
    if (!question) return null;

    const answers = filteredResponses
      .flatMap((response) => response.answers || [])
      .filter((answer) => answer.question_id === questionId);

    if (['multiple_choice', 'checkboxes', 'dropdown'].includes(question.type)) {
      const counts: Record<string, number> = {};

      answers.forEach((answer) => {
        const value = answer.answer_text || '';

        if (question.type === 'checkboxes') {
          try {
            const values = JSON.parse(value);
            if (Array.isArray(values)) {
              values.forEach((option) => {
                counts[option] = (counts[option] || 0) + 1;
              });
            }
          } catch {
            counts[value] = (counts[value] || 0) + 1;
          }
        } else {
          counts[value] = (counts[value] || 0) + 1;
        }
      });

      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }

    return null;
  };

  const COLORS = GRADIENT_COLORS.palette;

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[color:var(--primary)]" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <FormHeader
        title={form?.title ? `${form.title} - Responses` : 'Form Responses'}
        showExportButtons
        onExportCSV={exportToCSV}
        onExportExcel={exportToExcel}
        responsesCount={filteredResponses.length}
      />

      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {statsSummary.map((item) => (
            <Card key={item.label} className="border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg overflow-hidden">
              <div className={`rounded-2xl ${item.tone} p-5 h-full`}>
                <p className="text-sm font-medium opacity-80">{item.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight">{item.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant={activeTab === 'summary' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('summary')}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Summary
            </Button>
            <Button
              variant={activeTab === 'individual' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('individual')}
              className="gap-2"
            >
              Individual Responses
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] p-2 shadow-lg">
            <Filter className="ml-2 h-4 w-4 text-[color:var(--muted-foreground)]" />
            {(['all', 'direct', 'embed'] as SourceFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSourceFilter(filter)}
                className={[
                  'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                  sourceFilter === filter
                    ? 'bg-[color:var(--primary)] text-white shadow-sm'
                    : 'text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] dark:hover:bg-[color:var(--muted)]/50',
                ].join(' ')}
              >
                {filter === 'all' ? 'All sources' : SOURCE_LABELS[filter]}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'summary' ? (
          <div className="space-y-6">
            {filteredResponses.length === 0 ? (
              <Card className="border border-dashed border-[color:var(--border)] bg-[color:var(--card)] shadow-xl">
                <div className="py-16 text-center">
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--muted)] text-[color:var(--primary)]">
                    <BarChart3 className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)]">
                    No responses yet
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-[color:var(--muted-foreground)]">
                    Share your form to start collecting responses. This page will separate direct form submissions from embedded ones.
                  </p>
                </div>
              </Card>
            ) : (
              form?.questions.map((question) => {
                const stats = getQuestionStats(question.id);

                return (
                  <Card key={question.id} className="overflow-hidden border border-[color:var(--border)] bg-[color:var(--card)] shadow-xl">
                    <div className="border-b border-[color:var(--border)] px-6 py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
                            {question.title}
                          </h3>
                          {question.description && (
                            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                              {question.description}
                            </p>
                          )}
                        </div>
                        {question.is_required && (
                          <span className="rounded-full bg-[color:var(--muted)] px-3 py-1 text-xs font-semibold text-[color:var(--primary)]">
                            Required
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      {stats && stats.length > 0 ? (
                        <div className="grid gap-8 lg:grid-cols-2">
                          <div>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={stats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                                <XAxis dataKey="name" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip />
                                <Bar dataKey="value" fill={GRADIENT_COLORS.start} radius={[8, 8, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={stats}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={(entry) => entry.name}
                                  outerRadius={92}
                                  dataKey="value"
                                >
                                  {stats.map((entry, index) => (
                                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {filteredResponses.map((response, index) => {
                            const answer = response.answers?.find((a) => a.question_id === question.id);

                            return answer ? (
                              <div
                                key={index}
                                className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--muted)]/30 px-4 py-3 text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/50 transition-colors"
                              >
                                {answer.answer_text || JSON.stringify(answer.answer_data || '')}
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredResponses.length === 0 ? (
              <Card className="border border-dashed border-[color:var(--border)] bg-[color:var(--card)] shadow-xl">
                <div className="py-16 text-center">
                  <ShieldCheck className="mx-auto mb-5 h-12 w-12 text-[color:var(--muted-foreground)]" />
                  <h3 className="text-xl font-semibold text-[color:var(--foreground)]">
                    Nothing to show for this filter
                  </h3>
                  <p className="mt-2 text-[color:var(--muted-foreground)]">
                    Switch to a different source category to inspect those submissions.
                  </p>
                </div>
              </Card>
            ) : (
              filteredResponses.map((response, index) => (
                <Card key={response.id} className="overflow-hidden border border-[color:var(--border)] bg-[color:var(--card)] shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--border)] px-6 py-5">
                    <div>
                      <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
                        Response #{index + 1}
                      </h3>
                      <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                        Submitted {new Date(response.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[color:var(--primary)]/10 text-[color:var(--primary)] px-3 py-1 text-xs font-semibold">
                        {SOURCE_LABELS[(response.submission_source || 'direct') as Exclude<SourceFilter, 'all'>]}
                      </span>
                      {response.quiz_score !== undefined && response.quiz_score !== null && (
                        <span className="rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-3 py-1 text-xs font-semibold">
                          {response.quiz_score}/{response.quiz_max_score ?? 0}
                        </span>
                      )}
                      {response.respondent_email && (
                        <span className="rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 text-xs font-semibold">
                          {response.respondent_email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 p-6">
                    {form?.questions.map((question) => {
                      const answer = response.answers?.find((a) => a.question_id === question.id);

                      return (
                        <div key={question.id} className="rounded-2xl bg-[color:var(--muted)]/30 border border-[color:var(--border)] p-4 hover:bg-[color:var(--muted)]/50 transition-colors">
                          <p className="text-sm font-semibold text-[color:var(--muted-foreground)]">
                            {question.title}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-[color:var(--foreground)]">
                            {answer?.answer_text || JSON.stringify(answer?.answer_data || '') || 'No answer'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
