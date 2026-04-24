'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type { FormSettings } from '@/lib/types/database';
import { normalizeFormSettings } from '@/lib/form-settings';

interface FormSettingsModalProps {
  open: boolean;
  settings: FormSettings | null | undefined;
  onClose: () => void;
  onSave: (settings: FormSettings) => void;
}

type SectionKey = 'responses' | 'presentation' | 'defaults';

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="max-w-xl">
        <p className="text-sm font-medium text-[color:var(--foreground)]">{label}</p>
        {description && (
          <p className="mt-1 text-xs leading-5 text-[color:var(--muted-foreground)]">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          'relative h-6 w-11 rounded-full transition-colors overflow-hidden',
          checked ? 'bg-[color:var(--primary)] ' : 'bg-[color:var(--border)] ',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-[color:var(--card)] transition-transform duration-150 ease-out',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

function SelectField({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="py-3">
      <div className="max-w-xl">
        <p className="text-sm font-medium text-[color:var(--foreground)]">{label}</p>
        {description && (
          <p className="mt-1 text-xs leading-5 text-[color:var(--muted-foreground)]">
            {description}
          </p>
        )}
      </div>
      <div className="mt-3 flex justify-end">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-56 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-sm text-[color:var(--foreground)] shadow-sm outline-none transition focus:border-[color:var(--primary)]"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function FormSettingsModal({ open, settings, onClose, onSave }: FormSettingsModalProps) {
  const [draft, setDraft] = useState(normalizeFormSettings(settings));
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    responses: true,
    presentation: true,
    defaults: true,
  });

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(normalizeFormSettings(settings));
    }
  }, [open, settings]);

  if (!open) {
    return null;
  }

  const update = <K extends keyof FormSettings>(key: K, value: FormSettings[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const sectionHeader = (key: SectionKey, title: string, description: string) => (
    <button
      type="button"
      onClick={() => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))}
      className="flex w-full items-center justify-between gap-4 border-b border-[color:var(--border)] px-6 py-5 text-left"
    >
      <div>
        <p className="text-base font-semibold text-[color:var(--foreground)]">{title}</p>
        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">{description}</p>
      </div>
      {openSections[key] ? (
        <ChevronUp className="h-4 w-4 text-[color:var(--muted-foreground)]" />
      ) : (
        <ChevronDown className="h-4 w-4 text-[color:var(--muted-foreground)]" />
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-[0_30px_100px_rgba(15,23,42,0.3)]">
        <div className="flex items-center justify-between border-b border-[color:var(--border)] px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-[color:var(--foreground)]">Settings</h2>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Match the Google Forms-style options shown in your reference.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 p-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="max-h-[calc(92vh-152px)] overflow-y-auto">
          <div className="px-6 py-4">
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)] px-5 py-4">
              <ToggleSwitch
                label="Make this a quiz"
                description="Assign point values, set answers, and automatically provide feedback."
                checked={!!draft.is_quiz}
                onChange={(checked) => update('is_quiz', checked)}
              />
            </div>
          </div>

          <div className="border-t border-[color:var(--border)]">
            {sectionHeader('responses', 'Responses', 'Manage how responses are collected and protected')}
            {openSections.responses && (
              <div className="px-6 pb-2">
                <SelectField
                  label="Collect email addresses"
                  value={draft.collect_email_addresses || 'off'}
                  options={[
                    { label: 'Do not collect', value: 'off' },
                    { label: 'Optional', value: 'optional' },
                    { label: 'Required', value: 'required' },
                  ]}
                  onChange={(value) => update('collect_email_addresses', value as FormSettings['collect_email_addresses'])}
                />

                <SelectField
                  label="Send responders a copy of their response"
                  description="Requires Collect email addresses."
                  value={draft.send_response_copy || 'off'}
                  options={[
                    { label: 'Off', value: 'off' },
                    { label: 'Always', value: 'always' },
                  ]}
                  onChange={(value) => update('send_response_copy', value as FormSettings['send_response_copy'])}
                />

                <ToggleSwitch
                  label="Notify in email when response received"
                  description="Send an email notification to the admin whenever this form gets a new response."
                  checked={!!draft.notify_admin_on_response}
                  onChange={(checked) => update('notify_admin_on_response', checked)}
                />

                <ToggleSwitch
                  label="Allow response editing"
                  description="Responses can be changed after being submitted."
                  checked={!!draft.allow_response_editing}
                  onChange={(checked) => update('allow_response_editing', checked)}
                />

                <ToggleSwitch
                  label="Limit to 1 response"
                  description="Respondents will be limited to a single submission when an email address is collected."
                  checked={!!draft.limit_to_one_response}
                  onChange={(checked) => update('limit_to_one_response', checked)}
                />
              </div>
            )}
          </div>

          <div className="border-t border-[color:var(--border)]">
            {sectionHeader('presentation', 'Presentation', 'Manage how the form and responses are presented')}
            {openSections.presentation && (
              <div className="px-6 pb-2">
                <ToggleSwitch
                  label="Show progress bar"
                  description="Show the respondent how far they are in the form."
                  checked={!!draft.show_progress_bar}
                  onChange={(checked) => update('show_progress_bar', checked)}
                />

                <ToggleSwitch
                  label="Shuffle question order"
                  description="Randomize questions for each respondent."
                  checked={!!draft.shuffle_question_order}
                  onChange={(checked) => update('shuffle_question_order', checked)}
                />

                <div className="py-3">
                  <p className="text-sm font-medium text-[color:var(--foreground)]">Confirmation message</p>
                  <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                    This is shown after a successful submission.
                  </p>
                  <Textarea
                    value={draft.confirmation_message || ''}
                    onChange={(e) => update('confirmation_message', e.target.value)}
                    className="mt-3 min-h-24"
                    placeholder="Your response has been recorded."
                  />
                </div>

                <ToggleSwitch
                  label="Show link to submit another response"
                  description="Let respondents return and submit again from the confirmation screen."
                  checked={!!draft.show_submit_another_response}
                  onChange={(checked) => update('show_submit_another_response', checked)}
                />

                <ToggleSwitch
                  label="View results summary"
                  description="Share results summary with respondents."
                  checked={!!draft.show_results_summary}
                  onChange={(checked) => update('show_results_summary', checked)}
                />

                <ToggleSwitch
                  label="Disable autosave for all respondents"
                  description="Keep responses from being cached in the browser."
                  checked={!!draft.disable_autosave}
                  onChange={(checked) => update('disable_autosave', checked)}
                />
              </div>
            )}
          </div>

          <div className="border-t border-[color:var(--border)]">
            {sectionHeader('defaults', 'Defaults', 'Settings applied to this form and new questions')}
            {openSections.defaults && (
              <div className="px-6 pb-2">
                <SelectField
                  label="Collect email addresses by default"
                  description="Applied when the form is duplicated or used as a template."
                  value={draft.default_collect_email_addresses || 'off'}
                  options={[
                    { label: 'Do not collect', value: 'off' },
                    { label: 'Optional', value: 'optional' },
                    { label: 'Required', value: 'required' },
                  ]}
                  onChange={(value) => update('default_collect_email_addresses', value as FormSettings['default_collect_email_addresses'])}
                />

                <ToggleSwitch
                  label="Make questions required by default"
                  description="New questions will start as required."
                  checked={!!draft.default_question_required}
                  onChange={(checked) => update('default_question_required', checked)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[color:var(--border)] px-6 py-5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(normalizeFormSettings(draft))}>
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}
