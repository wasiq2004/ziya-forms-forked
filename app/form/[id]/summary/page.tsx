'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { FormWithQuestions, ResponseWithAnswers } from '@/lib/types/database';
import { BarChart3, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GRADIENT_COLORS } from '@/lib/config';

export default function PublicSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params?.id as string;

  const [form, setForm] = useState<FormWithQuestions | null>(null);
  const [responses, setResponses] = useState<ResponseWithAnswers[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (formId) {
      fetchSummary();
    }
  }, [formId]);

  const fetchSummary = async () => {
    try {
      const response = await fetch(`/api/forms/${formId}/summary`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch summary');
      }

      setForm(data.form);
      setResponses(data.responses || []);
    } catch (error) {
      console.error('Failed to fetch public summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const questionStats = useMemo(() => {
    if (!form) return [];

    return form.questions.map((question) => {
      const answers = responses.flatMap((response) => response.answers || []).filter((answer) => answer.question_id === question.id);

      if (['multiple_choice', 'checkboxes', 'dropdown'].includes(question.type)) {
        const counts: Record<string, number> = {};

        answers.forEach((answer) => {
          const value = answer.answer_text || '';
          counts[value] = (counts[value] || 0) + 1;
        });

        return {
          question,
          stats: Object.entries(counts).map(([name, value]) => ({ name, value })),
        };
      }

      return { question, stats: [] as Array<{ name: string; value: number }> };
    });
  }, [form, responses]);

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
          <h1 className="mb-4 text-2xl font-bold text-[color:var(--foreground)]">Summary not available</h1>
          <p className="text-[color:var(--muted-foreground)]">
            This form does not currently share a public results summary.
          </p>
          <Button variant="outline" onClick={() => router.push(`/form/${formId}`)} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to form
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)] py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-center justify-between rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] px-6 py-5 shadow-[0_24px_60px_rgba(15,23,42,0.1)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--primary)]">Public summary</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--foreground)]">{form.title}</h1>
          </div>
          <Button variant="secondary" onClick={() => router.push(`/form/${formId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to form
          </Button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card className="border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg">
            <div className="p-5">
              <p className="text-sm text-[color:var(--muted-foreground)]">Responses</p>
              <p className="mt-2 text-3xl font-bold text-[color:var(--foreground)]">{responses.length}</p>
            </div>
          </Card>
          <Card className="border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg">
            <div className="p-5">
              <p className="text-sm text-[color:var(--muted-foreground)]">Questions</p>
              <p className="mt-2 text-3xl font-bold text-[color:var(--foreground)]">{form.questions.length}</p>
            </div>
          </Card>
          <Card className="border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg">
            <div className="p-5">
              <p className="text-sm text-[color:var(--muted-foreground)]">Summary view</p>
              <p className="mt-2 text-3xl font-bold text-[color:var(--foreground)]">Public</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {questionStats.map(({ question, stats }) => (
            <Card key={question.id} className="overflow-hidden border border-[color:var(--border)] bg-[color:var(--card)] shadow-xl">
              <div className="border-b border-[color:var(--border)] px-6 py-5">
                <h3 className="text-lg font-semibold text-[color:var(--foreground)]">{question.title}</h3>
                {question.description && (
                  <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">{question.description}</p>
                )}
              </div>
              <div className="p-6">
                {stats.length > 0 ? (
                  <div className="grid gap-8 lg:grid-cols-2">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={stats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip />
                        <Bar dataKey="value" fill={GRADIENT_COLORS.start} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={stats} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.name} outerRadius={90} dataKey="value">
                          {stats.map((entry, index) => (
                            <Cell key={`${entry.name}-${index}`} fill={GRADIENT_COLORS.palette[index % GRADIENT_COLORS.palette.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--background)] px-4 py-6 text-[color:var(--muted-foreground)]">
                    <BarChart3 className="h-5 w-5" />
                    This question does not have aggregate chart data.
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
