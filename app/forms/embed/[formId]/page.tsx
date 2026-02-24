'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { FormWithQuestions } from '@/lib/types/database';
import { CheckCircle } from 'lucide-react';

export default function FormEmbedPage() {
  const params = useParams();
  const formId = params?.formId as string;
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
  }, [formId]);

  useEffect(() => {
    // Listen for height adjustment messages from the parent
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
      const response = await fetch(`/api/forms/${formId}/public`);
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
      
      const response = await fetch(`/api/forms/${formId}/submit/public`, {
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
      
      // Send height update to parent
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

  // Send height to parent when content changes
  useEffect(() => {
    const sendHeight = () => {
      if (window.parent && !submitSuccess) {
        const newHeight = document.body.scrollHeight;
        window.parent.postMessage({ type: 'resize', height: newHeight }, '*');
      }
    };
    
    // Send initial height
    sendHeight();
    
    // Send height when there are changes
    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, [submitSuccess]);

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

  if (!form.is_published || !form.is_accepting_responses) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Form Not Available</h1>
          <p className="text-gray-600">This form is not currently accepting responses.</p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Response Submitted!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for completing the form. Your response has been recorded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4 text-center">{form.title}</h1>
          {form.description && (
            <p className="text-gray-600 mb-6 text-center">{form.description}</p>
          )}
          
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {form.questions.map((question, index) => (
            <div key={question.id} className="border border-gray-200 rounded-lg p-6">
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
                    <p className="text-gray-600 mt-1">{question.description}</p>
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
                      <label htmlFor={`${question.id}-${idx}`} className="ml-3 block text-gray-700">
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
                      <label htmlFor={`${question.id}-${idx}`} className="ml-3 block text-gray-700">
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
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
              style={{
                background: 'linear-gradient(to right, #3b84f2, #57d58b)'
              }}
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}