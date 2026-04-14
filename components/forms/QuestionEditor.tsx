'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { X, Plus, GripVertical } from 'lucide-react';
import type { Question, QuestionType } from '@/lib/types/database';

interface QuestionEditorProps {
  question: Partial<Question>;
  onUpdate: (question: Partial<Question>) => void;
  onDelete: () => void;
  isQuiz?: boolean;
}

export function QuestionEditor({ question, onUpdate, onDelete, isQuiz = false }: QuestionEditorProps) {
  const [localQuestion, setLocalQuestion] = useState(question);

  const handleChange = (field: string, value: any) => {
    const updated = { ...localQuestion, [field]: value };
    setLocalQuestion(updated);
    onUpdate(updated);
  };

  const addOption = () => {
    const options = Array.isArray(localQuestion.options) ? localQuestion.options : [];
    handleChange('options', [...options, '']);
  };

  const updateOption = (index: number, value: string) => {
    const options = Array.isArray(localQuestion.options) ? [...localQuestion.options] : [];
    options[index] = value;
    handleChange('options', options);
  };

  const removeOption = (index: number) => {
    const options = Array.isArray(localQuestion.options) ? [...localQuestion.options] : [];
    options.splice(index, 1);
    handleChange('options', options);
  };

  const needsOptions = ['multiple_choice', 'checkboxes', 'dropdown'].includes(localQuestion.type || '');
  const optionValues = Array.isArray(localQuestion.options)
    ? localQuestion.options.map((option: any) => (typeof option === 'string' ? option : option.label || option.value || '')).filter(Boolean)
    : [];
  const showQuizSettings = isQuiz && ['short_answer', 'paragraph', 'multiple_choice', 'checkboxes', 'dropdown', 'linear_scale'].includes(localQuestion.type || '');

  return (
    <div className="bg-[color:var(--card)]  rounded-lg shadow-md p-6 mb-4 border-l-4 border-blue-500">
      <div className="flex items-start gap-4 mb-4">
        <GripVertical className="w-5 h-5 text-[color:var(--muted-foreground)] mt-2 cursor-move" />
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Question title"
            value={localQuestion.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className="text-lg font-semibold mb-2"
          />
          <Input
            type="text"
            placeholder="Description (optional)"
            value={localQuestion.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className="text-sm mb-3"
          />
          
          <div className="flex gap-4 items-center mb-4">
            <select
              value={localQuestion.type || 'short_answer'}
              onChange={(e) => handleChange('type', e.target.value as QuestionType)}
              className="px-3 py-2 border border-[color:var(--border)]  rounded-lg"
            >
              <option value="short_answer">Short Answer</option>
              <option value="paragraph">Paragraph</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="checkboxes">Checkboxes</option>
              <option value="dropdown">Dropdown</option>
              <option value="linear_scale">Linear Scale</option>
            </select>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localQuestion.is_required || false}
                onChange={(e) => handleChange('is_required', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Required</span>
            </label>
          </div>

          {needsOptions && (
            <div className="space-y-2">
              <p className="text-sm font-medium mb-2">Options:</p>
              {(localQuestion.options || []).map((option: any, index: number) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-[color:var(--muted-foreground)]">{index + 1}.</span>
                  <Input
                    type="text"
                    value={typeof option === 'string' ? option : option.label || ''}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  <button
                    onClick={() => removeOption(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={addOption}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Option
              </Button>
            </div>
          )}

          {localQuestion.type === 'linear_scale' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Min value"
                value={localQuestion.settings?.min || 1}
                onChange={(e) => handleChange('settings', { ...localQuestion.settings, min: parseInt(e.target.value) })}
              />
              <Input
                type="number"
                label="Max value"
                value={localQuestion.settings?.max || 5}
                onChange={(e) => handleChange('settings', { ...localQuestion.settings, max: parseInt(e.target.value) })}
              />
            </div>
          )}

          {showQuizSettings && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-3 text-sm font-semibold text-amber-900">Quiz settings</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  type="number"
                  label="Points"
                  min={0}
                  value={localQuestion.settings?.points ?? 1}
                  onChange={(e) => handleChange('settings', { ...localQuestion.settings, points: Number(e.target.value) || 0 })}
                />

                {localQuestion.type === 'multiple_choice' || localQuestion.type === 'dropdown' ? (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-amber-900">Correct answer</label>
                    <select
                      value={localQuestion.settings?.correctAnswer || ''}
                      onChange={(e) => handleChange('settings', { ...localQuestion.settings, correctAnswer: e.target.value })}
                      className="w-full rounded-lg border border-amber-300 bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] outline-none"
                    >
                      <option value="">Select correct answer</option>
                      {optionValues.map((option, index) => (
                        <option key={`${option}-${index}`} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {localQuestion.type === 'checkboxes' ? (
                  <Input
                    label="Correct answers"
                    placeholder="Separate answers with commas"
                    value={(localQuestion.settings?.correctAnswers || []).join(', ')}
                    onChange={(e) =>
                      handleChange('settings', {
                        ...localQuestion.settings,
                        correctAnswers: e.target.value
                          .split(',')
                          .map((item) => item.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                ) : null}

                {localQuestion.type === 'linear_scale' ? (
                  <Input
                    type="number"
                    label="Correct answer"
                    value={localQuestion.settings?.correctAnswer || ''}
                    onChange={(e) => handleChange('settings', { ...localQuestion.settings, correctAnswer: e.target.value })}
                  />
                ) : null}

                {localQuestion.type === 'short_answer' || localQuestion.type === 'paragraph' ? (
                  <Input
                    label="Correct answer"
                    placeholder="Expected answer"
                    value={localQuestion.settings?.correctAnswer || ''}
                    onChange={(e) => handleChange('settings', { ...localQuestion.settings, correctAnswer: e.target.value })}
                  />
                ) : null}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Input
                  label="Feedback for correct answer"
                  placeholder="Great job!"
                  value={localQuestion.settings?.feedbackCorrect || ''}
                  onChange={(e) => handleChange('settings', { ...localQuestion.settings, feedbackCorrect: e.target.value })}
                />
                <Input
                  label="Feedback for incorrect answer"
                  placeholder="Try again."
                  value={localQuestion.settings?.feedbackIncorrect || ''}
                  onChange={(e) => handleChange('settings', { ...localQuestion.settings, feedbackIncorrect: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
