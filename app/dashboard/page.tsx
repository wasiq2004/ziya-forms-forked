'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Plus, FileText, Trash2, Edit, BarChart3, Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { Form, TemplateForm } from '@/lib/types/database';
import { Skeleton } from '@/components/ui/Skeleton';
import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [forms, setForms] = useState<Form[]>([]);
  const [templates, setTemplates] = useState<TemplateForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated' || !session) {
      router.replace('/auth/login');
      return;
    }

    if (session.user?.role === 'super_admin') {
      router.replace('/admin/dashboard');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.allSettled([fetchForms(), fetchTemplates()]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [session, status, router]);

  const fetchForms = async () => {
    try {
      const response = await apiFetch('/api/forms');
      const data = await response.json();
      setForms(data.forms || []);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
      setForms([]);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await apiFetch('/api/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setTemplates([]);
    }
  };

  const createNewForm = async () => {
    setIsCreating(true);
    try {
      const response = await apiFetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Form',
          description: '',
        }),
      });
      const data = await response.json();
      if (data.form) {
        router.push(`/form/${data.form.id}/edit`);
      }
    } catch (error) {
      console.error('Failed to create form:', error);
      alert('Failed to create form');
    } finally {
      setIsCreating(false);
    }
  };

  const createFromTemplate = async (templateId: string) => {
    setIsCreating(true);
    try {
      const response = await apiFetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
        }),
      });
      const data = await response.json();
      if (data.form) {
        router.push(`/form/${data.form.id}/edit`);
      }
    } catch (error) {
      console.error('Failed to create form from template:', error);
      alert('Failed to create form from template');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    
    try {
      const response = await apiFetch(`/api/forms/${formId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setForms(forms.filter(f => f.id !== formId));
      } else {
        throw new Error('Failed to delete form');
      }
    } catch (error) {
      console.error('Failed to delete form:', error);
      alert('Failed to delete form');
    }
  };

  const copyFormLink = (formId: string) => {
    const link = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(link);
    // Show a toast notification instead of alert in a real implementation
    alert('Form link copied to clipboard!');
  };

  const publishedFormsCount = forms.filter((form) => form.is_published).length;

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-[color:var(--background)] px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-10 w-72" />
                <Skeleton className="h-5 w-[28rem]" />
              </div>
              <Skeleton className="h-12 w-36 rounded-full" />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-sm">
          <div
            className="h-1 w-full"
            style={{
              background: 'linear-gradient(90deg, var(--primary), var(--gradient-end), var(--accent-purple))',
            }}
          />
          <div className="p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--muted)] bg-[color:var(--muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--primary)]">
                Workspace
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[color:var(--foreground)]">
                Your Forms
              </h1>
              <p className="mt-3 text-lg text-[color:var(--muted-foreground)]">
                Create, edit, and manage forms from one clean workspace.
              </p>
            </div>

            <Button
              onClick={createNewForm}
              isLoading={isCreating}
              className="flex items-center gap-2 bg-[color:var(--primary)] px-6 py-3 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:opacity-95 hover:shadow-xl hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              New Form
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-[color:var(--card)] p-4 shadow-sm ring-1 ring-[color:var(--border)]">
              <p className="text-sm text-[color:var(--muted-foreground)]">Forms</p>
              <p className="mt-1 text-2xl font-bold text-[color:var(--foreground)]">{forms.length}</p>
            </div>
            <div className="rounded-2xl bg-[color:var(--card)] p-4 shadow-sm ring-1 ring-[color:var(--border)]">
              <p className="text-sm text-[color:var(--muted-foreground)]">Templates</p>
              <p className="mt-1 text-2xl font-bold text-[color:var(--foreground)]">{templates.length}</p>
            </div>
            <div className="rounded-2xl bg-[color:var(--card)] p-4 shadow-sm ring-1 ring-[color:var(--border)]">
              <p className="text-sm text-[color:var(--muted-foreground)]">Published</p>
              <p className="mt-1 text-2xl font-bold text-[color:var(--foreground)]">{publishedFormsCount}</p>
            </div>
          </div>
          </div>
        </div>

        {forms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-[color:var(--muted)] rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-[color:var(--primary)]" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-[color:var(--foreground)]">
              No forms yet
            </h3>
            <p className="text-[color:var(--muted-foreground)] mb-8 max-w-md mx-auto">
              Create your first form to get started with collecting responses and analyzing data.
            </p>
            <Button
              onClick={createNewForm}
              isLoading={isCreating}
              className="bg-[color:var(--primary)] hover:opacity-95 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Form
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form, index) => (
              <Card
              key={form.id}
              hover
                className="relative bg-[color:var(--card)] border border-[color:var(--border)] shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold line-clamp-1 text-[color:var(--foreground)]">
                      {form.title}
                    </h3>
                    {form.is_published && (
                      <span className="px-3 py-1 text-xs rounded-full bg-[color:var(--status-success-light)] text-[color:var(--status-success-text-light)] font-medium">
                        Published
                      </span>
                    )}
                  </div>
                  {form.description && (
                    <p className="text-sm text-[color:var(--muted-foreground)] line-clamp-2 mb-4">
                      {form.description}
                    </p>
                  )}
                  <p className="text-xs text-[color:var(--muted-foreground)] mb-4">
                    Created {new Date(form.created_at).toLocaleDateString()}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <Link href={`/form/${form.id}/edit`}>
                      <Button variant="outline" size="sm" className="w-full border-[color:var(--border)] hover:bg-[color:var(--muted)]/60 dark:hover:bg-[color:var(--muted)] transition-colors">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/responses/${form.id}`}>
                      <Button variant="outline" size="sm" className="w-full border-[color:var(--border)] hover:bg-[color:var(--muted)]/60 dark:hover:bg-[color:var(--muted)] transition-colors">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Responses
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]/60 dark:hover:bg-[color:var(--muted)] transition-colors"
                      onClick={() => copyFormLink(form.id)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Link
                    </Button>
                    <Link href={`/form/${form.id}`} target="_blank">
                      <Button variant="ghost" size="sm" className="w-full text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]/60 dark:hover:bg-[color:var(--muted)] transition-colors">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    onClick={() => deleteForm(form.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Template Section */}
        <div className="mt-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-[color:var(--foreground)]">
              Templates
            </h2>
            <p className="text-[color:var(--muted-foreground)]">
              Start with pre-built templates to save time
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} hover className="relative bg-[color:var(--card)] border border-[color:var(--border)] shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="p-6">
                  <div className="w-12 h-12 bg-[color:var(--muted)] rounded-xl flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-[color:var(--icon-blue)]" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-[color:var(--foreground)]">
                    {template.title}
                  </h3>
                  <p className="text-sm text-[color:var(--muted-foreground)] mb-4">
                    {template.description || 'Use this template to start quickly.'}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[color:var(--muted-foreground)]">
                      {template.questions?.length || 0} questions
                    </p>
                    <Button
                      onClick={() => createFromTemplate(template.id)}
                      isLoading={isCreating}
                      size="sm"
                      className="bg-[color:var(--primary)] hover:opacity-95 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Use Template
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
