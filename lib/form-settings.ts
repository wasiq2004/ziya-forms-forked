import type { EmailCollectionMode, FormSettings, ResponseCopyMode } from '@/lib/types/database';

export const DEFAULT_FORM_SETTINGS: Required<FormSettings> = {
  is_quiz: false,
  collect_email_addresses: 'off',
  send_response_copy: 'off',
  notify_admin_on_response: false,
  allow_response_editing: false,
  limit_to_one_response: false,
  show_progress_bar: false,
  shuffle_question_order: false,
  confirmation_message: 'Your response has been recorded.',
  show_submit_another_response: true,
  show_results_summary: false,
  disable_autosave: false,
  default_collect_email_addresses: 'off',
  default_question_required: false,
};

export function normalizeFormSettings(settings?: Partial<FormSettings> | null): Required<FormSettings> {
  return {
    ...DEFAULT_FORM_SETTINGS,
    ...(settings || {}),
    confirmation_message: settings?.confirmation_message?.trim() || DEFAULT_FORM_SETTINGS.confirmation_message,
  };
}

export function getEmailCollectionMode(settings?: Partial<FormSettings> | null): EmailCollectionMode {
  return normalizeFormSettings(settings).collect_email_addresses;
}

export function getResponseCopyMode(settings?: Partial<FormSettings> | null): ResponseCopyMode {
  return normalizeFormSettings(settings).send_response_copy;
}

export function requiresRespondentEmail(settings?: Partial<FormSettings> | null): boolean {
  const normalized = normalizeFormSettings(settings);
  return (
    normalized.collect_email_addresses === 'required' ||
    normalized.limit_to_one_response ||
    normalized.send_response_copy === 'always' ||
    normalized.notify_admin_on_response
  );
}

export function shouldShowRespondentEmailField(settings?: Partial<FormSettings> | null): boolean {
  const normalized = normalizeFormSettings(settings);
  return (
    normalized.collect_email_addresses !== 'off' ||
    normalized.limit_to_one_response ||
    normalized.send_response_copy === 'always' ||
    normalized.notify_admin_on_response
  );
}
