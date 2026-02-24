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
}

export function QuestionEditor({ question, onUpdate, onDelete }: QuestionEditorProps) {
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4 border-l-4 border-blue-500">
      <div className="flex items-start gap-4 mb-4">
        <GripVertical className="w-5 h-5 text-gray-400 mt-2 cursor-move" />
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
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
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
                  <span className="text-gray-500">{index + 1}.</span>
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
