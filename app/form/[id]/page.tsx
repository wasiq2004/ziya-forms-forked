'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { FormWithQuestions } from '@/lib/types/database';
import { CheckCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function FormViewPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params?.id as string;
  const { data: session, status } = useSession();

  const [form, setForm] = useState<FormWithQuestions | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [respondentEmail, setRespondentEmail] = useState('');

  useEffect(() => {
    if (formId) {
      fetchForm();
    }
  }, [formId, status]);

  const fetchForm = async () => {
    try {
      // If user is authenticated, use the regular API endpoint
      // Otherwise, use the public endpoint
      const endpoint = status === 'authenticated' 
        ? `/api/forms/${formId}`
        : `/api/forms/${formId}/public`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch form');
      }
      
      setForm(data.form);
    } catch (error) {
      console.error('Failed to fetch form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare answers for submission
      const answersToSubmit = form.questions.map(question => ({
        question_id: question.id,
        answer_text: answers[question.id] || '',
        answer_data: {}
      }));
      
      // Use public endpoint for unauthenticated users, regular endpoint for authenticated users
      const endpoint = status === 'authenticated' 
        ? `/api/forms/${formId}/submit`
        : `/api/forms/${formId}/submit/public`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_data: {
            respondent_email: respondentEmail,
            answers: answersToSubmit
          }
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit response');
      }
      
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to submit response:', error);
      alert('Failed to submit response: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Form Not Found</h1>
          <p className="text-gray-600">The form you're looking for doesn't exist or is no longer available.</p>
        </div>
      </div>
    );
  }

  if (!form.is_published) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Form Not Published</h1>
          <p className="text-gray-600">This form is not currently accepting responses.</p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Response Submitted!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Thank you for completing the form. Your response has been recorded.
          </p>
          <Button onClick={() => router.push('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6"
          style={{ borderTop: `8px solid ${form.theme_color || '#3b84f2'}` }}
        >
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">{form.title}</h1>
            {form.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-6">{form.description}</p>
            )}
            
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Email (optional)
              </label>
              <Input
                id="email"
                type="email"
                value={respondentEmail}
                onChange={(e) => setRespondentEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {form.questions.map((question, index) => (
            <div 
              key={question.id} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-medium mr-3 mt-1">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-medium">
                      {question.title}
                      {question.is_required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    {question.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{question.description}</p>
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
                          type={question.type === 'multiple_choice' ? 'radio' : 'radio'}
                          id={`${question.id}-${idx}`}
                          name={question.id}
                          value={typeof option === 'string' ? option : option.value}
                          checked={answers[question.id] === (typeof option === 'string' ? option : option.value)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAnswerChange(question.id, e.target.value)}
                          required={question.is_required}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`${question.id}-${idx}`} className="ml-3 block text-gray-700 dark:text-gray-300">
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
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <label htmlFor={`${question.id}-${idx}`} className="ml-3 block text-gray-700 dark:text-gray-300">
                          {typeof option === 'string' ? option : option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="px-8 py-3"
            >
              Submit
            </Button>
          </div>
        </form>
        
        {/* Powered by Ziya Forms footer */}
        <div className="mt-8 text-center">
          <a 
            href="https://ziyaforms.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Powered by Ziya Forms
          </a>
        </div>
      </div>
    </div>
  );
}