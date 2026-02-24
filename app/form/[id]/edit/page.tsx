'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { QuestionEditor } from '@/components/forms/QuestionEditor';
import { Plus, Save, Eye, ArrowLeft, Link as LinkIcon, Copy } from 'lucide-react';
import Link from 'next/link';
import FormHeader from '@/components/ui/FormHeader';
import type { Form, Question } from '@/lib/types/database';

export default function FormEditPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params?.id as string;
  const { data: session, status } = useSession();

  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }
    
    if (formId) {
      fetchForm();
    }
  }, [formId, session, status, router]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${formId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch form');
      }
      
      setForm(data.form);
      setQuestions(data.form.questions || []);
    } catch (error) {
      console.error('Failed to fetch form:', error);
      alert('Failed to load form');
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: '',
        form_id: formId,
        title: '',
        type: 'short_answer',
        options: [],
        is_required: false,
        order_index: questions.length,
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  };

  const updateQuestion = (index: number, updated: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updated } as Question;
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const saveForm = async () => {
    if (!form) return;
    
    setIsSaving(true);
    try {
      // Update form metadata
      const formResponse = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          theme_color: form.theme_color,
          is_published: form.is_published,
          is_accepting_responses: form.is_accepting_responses,
        }),
      });
      
      if (!formResponse.ok) {
        const errorData = await formResponse.json();
        throw new Error(errorData.error || 'Failed to save form');
      }

      // Update questions
      const questionsResponse = await fetch(`/api/forms/${formId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      });
      
      if (!questionsResponse.ok) {
        const errorData = await questionsResponse.json();
        throw new Error(errorData.error || 'Failed to save questions');
      }

      // Show success message
      alert('Form saved successfully!');
    } catch (error) {
      console.error('Failed to save form:', error);
      alert('Failed to save form: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!form) return;
    
    const newPublishState = !form.is_published;
    setForm(prev => prev ? { ...prev, is_published: newPublishState } : null);
    
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          is_published: newPublishState,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update publish status');
      }
    } catch (error) {
      console.error('Failed to update publish status:', error);
      alert('Failed to update publish status');
      // Revert the UI change
      setForm(prev => prev ? { ...prev, is_published: !newPublishState } : null);
    }
  };

  const copyEmbedCode = () => {
    setShowEmbedModal(true);
  };

  const copyPublicLink = () => {
    if (!form) return;
    
    const publicLink = `${window.location.origin}/form/${formId}`;
    
    navigator.clipboard.writeText(publicLink)
      .then(() => {
        alert('Public link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy public link: ', err);
        // Fallback: show the link in an alert
        alert(`Copy this link:\n\n${publicLink}`);
      });
  };

  const copyEmbedLink = () => {
    if (!form) return;
    
    const embedLink = `${window.location.origin}/forms/embed/${formId}`;
    
    navigator.clipboard.writeText(embedLink)
      .then(() => {
        alert('Embed link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy embed link: ', err);
        // Fallback: show the link in an alert
        alert(`Copy this link:\n\n${embedLink}`);
      });
  };

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
        title="Form Builder"
        showPreviewButton
        showSaveButton
        onPreview={() => window.open(`/form/${formId}`, '_blank')}
        onSave={saveForm}
        onPublish={togglePublish}
        onCopyEmbed={copyEmbedCode}
        onCopyLink={copyPublicLink}
        isSaving={isSaving}
        isPublishing={isPublishing}
        isPublished={form?.is_published}
        showPublishButton
        showEmbedButton
        showCopyLinkButton
        embedUrl={form?.is_published ? `${window.location.origin}/form/${formId}` : ''}
      />

      {/* Embed Modal */}
      {showEmbedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Embed Form</h2>
                <button 
                  onClick={() => setShowEmbedModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-gray-700 mb-4">
                Copy and paste this code into your website to embed this form.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Embed Link
                </label>
                <div className="flex">
                  <Input
                    readOnly
                    value={`${window.location.origin}/forms/embed/${formId}`}
                    className="flex-1"
                  />
                  <Button 
                    onClick={copyEmbedLink}
                    className="ml-2"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Iframe Code
                </label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={`<iframe 
  src="${window.location.origin}/forms/embed/${formId}" 
  width="100%" 
  height="700" 
  frameborder="0"
  style="borderRadius: 8px;">
</iframe>`}
                    className="w-full h-40 p-3 border border-gray-300 rounded-md font-mono text-sm text-gray-800 bg-gray-50"
                  />
                  <Button 
                    onClick={() => {
                      const embedCode = `<iframe 
  src="${window.location.origin}/forms/embed/${formId}" 
  width="100%" 
  height="700" 
  frameborder="0"
  style="borderRadius: 8px;">
</iframe>`;
                      navigator.clipboard.writeText(embedCode);
                      alert('Embed code copied to clipboard!');
                    }}
                    className="absolute top-2 right-2"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => setShowEmbedModal(false)}
                  variant="outline"
                  className="mr-2"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <Input
            type="text"
            value={form?.title || ''}
            onChange={(e) => setForm(prev => prev ? { ...prev, title: e.target.value } : null)}
            className="text-3xl font-bold mb-4"
            placeholder="Form Title"
          />
          <Input
            type="text"
            value={form?.description || ''}
            onChange={(e) => setForm(prev => prev ? { ...prev, description: e.target.value } : null)}
            className="text-gray-600"
            placeholder="Form description (optional)"
          />
        </div>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <QuestionEditor
              key={question.id || index}
              question={question}
              onUpdate={(updated) => updateQuestion(index, updated)}
              onDelete={() => deleteQuestion(index)}
            />
          ))}
        </div>

        <Button
          onClick={addQuestion}
          variant="outline"
          className="w-full mt-6"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Question
        </Button>
      </div>
    </div>
  );
}