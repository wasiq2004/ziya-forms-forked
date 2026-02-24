'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Download, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { FormWithQuestions, ResponseWithAnswers } from '@/lib/types/database';
import { GRADIENT_COLORS } from '@/lib/config';
import { nanoid } from 'nanoid';
import FormHeader from '@/components/ui/FormHeader';

export default function ResponsesPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params?.formId as string;
  const { data: session, status } = useSession();

  const [form, setForm] = useState<FormWithQuestions | null>(null);
  const [responses, setResponses] = useState<ResponseWithAnswers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'individual'>('summary');

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
        fetch(`/api/forms/${formId}`),
        fetch(`/api/responses/${formId}`)
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

  const exportToCSV = () => {
    if (!form || responses.length === 0) return;

    const headers = ['Submitted At', ...form.questions.map(q => q.title)];
    const rows = responses.map(response => {
      const row = [new Date(response.submitted_at).toLocaleString()];
      form.questions.forEach(question => {
        const answer = response.answers?.find(a => a.question_id === question.id);
        row.push(answer?.answer_text || '');
      });
      return row;
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.title}-responses.csv`;
    a.click();
  };

  const exportToExcel = () => {
    // Trigger Excel export from API
    window.open(`/api/responses/${formId}/export`, '_blank');
  };

  const getQuestionStats = (questionId: string) => {
    const question = form?.questions.find(q => q.id === questionId);
    if (!question) return null;

    const answers = responses
      .flatMap(r => r.answers || [])
      .filter(a => a.question_id === questionId);

    if (['multiple_choice', 'checkboxes', 'dropdown'].includes(question.type)) {
      const counts: Record<string, number> = {};
      answers.forEach(answer => {
        const value = answer.answer_text || '';
        if (question.type === 'checkboxes') {
          try {
            const values = JSON.parse(value);
            if (Array.isArray(values)) {
              values.forEach(v => {
                counts[v] = (counts[v] || 0) + 1;
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <FormHeader
        title={form?.title ? `${form.title} - Responses` : "Form Responses"}
        showExportButtons
        onExportCSV={exportToCSV}
        onExportExcel={exportToExcel}
        responsesCount={responses.length}
      />

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'summary' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('summary')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Summary
          </Button>
          <Button
            variant={activeTab === 'individual' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('individual')}
          >
            Individual Responses
          </Button>
        </div>

        {activeTab === 'summary' ? (
          <div className="space-y-6">
            {responses.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <h3 className="text-xl font-semibold mb-2">No responses yet</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Share your form to start collecting responses
                  </p>
                </div>
              </Card>
            ) : (
              form?.questions.map(question => {
                const stats = getQuestionStats(question.id);
                
                return (
                  <Card key={question.id}>
                    <h3 className="text-lg font-semibold mb-4">{question.title}</h3>
                    
                    {stats && stats.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="value" fill={GRADIENT_COLORS.start} />
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
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {stats.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {responses.map((response, idx) => {
                          const answer = response.answers?.find(a => a.question_id === question.id);
                          return answer ? (
                            <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                              {answer.answer_text}
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {responses.map((response, idx) => (
              <Card key={response.id}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Response #{idx + 1}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(response.submitted_at).toLocaleString()}
                  </p>
                </div>
                
                <div className="space-y-4">
                  {form?.questions.map(question => {
                    const answer = response.answers?.find(a => a.question_id === question.id);
                    return (
                      <div key={question.id}>
                        <p className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {question.title}
                        </p>
                        <p className="text-gray-900 dark:text-gray-100">
                          {answer?.answer_text || 'No answer'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}