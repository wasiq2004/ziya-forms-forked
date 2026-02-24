'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { motion } from 'framer-motion';
import { Plus, FileText, Trash2, Edit, BarChart3, Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { Form } from '@/lib/types/database';
import { APP_NAME } from '@/lib/config';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Sample template form
  const templateForms = [
    {
      id: 'template-1',
      title: 'Contact Information Form',
      description: 'Collect basic contact information from your users',
      questions: 3,
    }
  ];

  useEffect(() => {
    console.log('Dashboard useEffect triggered', { status, session });
    
    if (status === 'loading') {
      console.log('Session is loading...');
      return;
    }
    
    if (status === 'unauthenticated') {
      console.log('User is unauthenticated, redirecting to login');
      router.push('/auth/login');
      return;
    }
    
    if (!session) {
      console.log('No session found, redirecting to login');
      router.push('/auth/login');
      return;
    }
    
    console.log('Session found, fetching forms');
    // Small delay to ensure session is fully established
    const timer = setTimeout(() => {
      fetchForms();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [session, status, router]);

  const fetchForms = async () => {
    try {
      const response = await fetch('/api/forms');
      const data = await response.json();
      setForms(data.forms || []);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
      setForms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewForm = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/forms', {
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
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Contact Information Form',
          description: 'Collect basic contact information from your users',
        }),
      });
      const data = await response.json();
      if (data.form) {
        // In a real implementation, we would copy the template structure
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
      const response = await fetch(`/api/forms/${formId}`, {
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

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    console.log('Rendering login redirect because unauthenticated');
    router.push('/auth/login');
    return null;
  }

  if (!session) {
    console.log('Rendering null because no session');
    router.push('/auth/login');
    return null;
  }

  console.log('Rendering dashboard with session:', session);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2 font-[family-name:var(--font-poppins)]">
              Your Forms
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Create, edit, and manage your forms
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
              Note: Publish your forms to make them publicly accessible via the "View" button
            </p>
          </div>
          <Button
            onClick={createNewForm}
            isLoading={isCreating}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Form
          </Button>
        </div>

        {forms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <FileText className="w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">No forms yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first form to get started
            </p>
            <Button onClick={createNewForm} isLoading={isCreating}>
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
                className="relative"
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold line-clamp-1">
                      {form.title}
                    </h3>
                    {form.is_published && (
                      <span className="px-2 py-1 text-xs rounded-full gradient-bg text-white">
                        Published
                      </span>
                    )}
                  </div>
                  {form.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {form.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Created {new Date(form.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/form/${form.id}/edit`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/responses/${form.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Responses
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => copyFormLink(form.id)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Link
                  </Button>
                  <Link href={`/form/${form.id}`} target="_blank">
                    <Button variant="ghost" size="sm" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => deleteForm(form.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Template Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 font-[family-name:var(--font-poppins)]">
            Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templateForms.map((template) => (
              <Card key={template.id} hover className="relative">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">{template.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {template.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {template.questions} questions
                  </p>
                </div>
                <Button
                  onClick={() => createFromTemplate(template.id)}
                  isLoading={isCreating}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}