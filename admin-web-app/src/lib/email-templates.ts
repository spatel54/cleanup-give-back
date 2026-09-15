/**
 * Server-side reads/writes for the `email_templates` table - both "system"
 * rows (the 6 system automated-send templates, looked up by `template_type`)
 * and "custom" rows (freeform templates Admin creates for the Compose flow,
 * looked up by `id`). See `admin/db/011_email_templates.sql` for the schema
 * rationale. A missing system row (migration not yet applied) falls back to
 * `DEFAULT_TEMPLATES` in `email-template-render.ts` - a send never breaks on
 * a missing row. Order placed/shipped HTML is always built by `order-email-html.ts`.
 * Hours-reminder HTML is always built by `hours-reminder-email-html.ts`.
 */
import { createDataClient, createServiceClient } from '@/lib/supabase/server';
import {
  DEFAULT_TEMPLATES,
  EMAIL_TAB_TEMPLATE_TYPES,
  EMAIL_TEMPLATE_LABELS,
  type EmailTemplateType,
} from '@/lib/email-template-render';
import { sanitizeEmailHtml } from '@/lib/sanitize-html';

export type { EmailTemplateType } from '@/lib/email-template-render';

export type EmailTemplate = {
  templateType: EmailTemplateType;
  subject: string;
  bodyHtml: string;
  updatedAt: string | null;
};

export type EmailTemplateRecord = {
  id: string;
  templateType: EmailTemplateType | null;
  name: string;
  subject: string;
  bodyHtml: string;
  isSystem: boolean;
  updatedAt: string | null;
};

/** Fetch one system template, falling back to the hardcoded default if no row exists (or the table doesn't exist yet). */
export async function getTemplate(type: EmailTemplateType): Promise<EmailTemplate> {
  try {
    const supabase = await createDataClient();
    const { data } = await supabase
      .from('email_templates')
      .select('template_type, subject, body_html, updated_at')
      .eq('template_type', type)
      .maybeSingle();

    if (data) {
      return { templateType: type, subject: data.subject, bodyHtml: data.body_html, updatedAt: data.updated_at };
    }
  } catch (err) {
    console.warn('[email-templates] failed to load template, using default:', err);
  }

  const fallback = DEFAULT_TEMPLATES[type];
  return { templateType: type, subject: fallback.subject, bodyHtml: fallback.bodyHtml, updatedAt: null };
}

/** Templates shown on the Emails tab - custom rows plus any system types still in EMAIL_TAB_TEMPLATE_TYPES (currently none; branded mail is code-owned). */
export async function listAllTemplates(): Promise<EmailTemplateRecord[]> {
  try {
    const supabase = await createDataClient();
    const { data, error } = await supabase
      .from('email_templates')
      .select('id, template_type, name, subject, body_html, is_system, updated_at')
      .order('is_system', { ascending: false })
      .order('name', { ascending: true });

    if (!error && data) {
      const bySystemType = new Map(
        data.filter((r) => r.is_system && r.template_type).map((r) => [r.template_type as string, r]),
      );
      const missingSystemDefaults: EmailTemplateRecord[] = EMAIL_TAB_TEMPLATE_TYPES.filter(
        (type) => !bySystemType.has(type),
      ).map((type) => ({
        id: `default-${type}`,
        templateType: type,
        name: EMAIL_TEMPLATE_LABELS[type],
        subject: DEFAULT_TEMPLATES[type].subject,
        bodyHtml: DEFAULT_TEMPLATES[type].bodyHtml,
        isSystem: true,
        updatedAt: null,
      }));

      // Emails tab only lists custom (non-system) templates - branded system
      // mail (hours reminder, order placed/shipped) is code-owned HTML.
      const rows: EmailTemplateRecord[] = data
        .filter((r) => !r.is_system || EMAIL_TAB_TEMPLATE_TYPES.includes(r.template_type as EmailTemplateType))
        .map((r) => ({
          id: r.id,
          templateType: (r.template_type as EmailTemplateType | null) ?? null,
          name: r.name,
          subject: r.subject,
          bodyHtml: r.body_html,
          isSystem: r.is_system,
          updatedAt: r.updated_at,
        }));

      return [...missingSystemDefaults, ...rows].sort((a, b) => {
        if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }
  } catch (err) {
    console.warn('[email-templates] failed to list templates, using defaults only:', err);
  }

  return EMAIL_TAB_TEMPLATE_TYPES.map((type) => ({
    id: `default-${type}`,
    templateType: type,
    name: EMAIL_TEMPLATE_LABELS[type],
    subject: DEFAULT_TEMPLATES[type].subject,
    bodyHtml: DEFAULT_TEMPLATES[type].bodyHtml,
    isSystem: true,
    updatedAt: null,
  }));
}

export async function saveSystemTemplate(
  type: EmailTemplateType,
  subject: string,
  bodyHtml: string,
  updatedBy: string,
): Promise<void> {
  const supabase = await createServiceClient();
  const { error } = await supabase.from('email_templates').upsert(
    {
      template_type: type,
      name: EMAIL_TEMPLATE_LABELS[type],
      subject,
      body_html: sanitizeEmailHtml(bodyHtml),
      is_system: true,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    } as never,
    { onConflict: 'template_type' },
  );
  if (error) throw new Error(error.message);
}

export async function createCustomTemplate(
  name: string,
  subject: string,
  bodyHtml: string,
  createdBy: string,
): Promise<string> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from('email_templates')
    .insert({
      name,
      subject,
      body_html: sanitizeEmailHtml(bodyHtml),
      is_system: false,
      created_by: createdBy,
      updated_by: createdBy,
      updated_at: new Date().toISOString(),
    } as never)
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to create template');
  return (data as { id: string }).id;
}

export async function updateCustomTemplate(
  id: string,
  name: string,
  subject: string,
  bodyHtml: string,
  updatedBy: string,
): Promise<void> {
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from('email_templates')
    .update(
      { name, subject, body_html: sanitizeEmailHtml(bodyHtml), updated_at: new Date().toISOString(), updated_by: updatedBy } as never,
    )
    .eq('id', id)
    .eq('is_system', false);
  if (error) throw new Error(error.message);
}

export async function deleteCustomTemplate(id: string): Promise<void> {
  const supabase = await createServiceClient();
  const { error } = await supabase.from('email_templates').delete().eq('id', id).eq('is_system', false);
  if (error) throw new Error(error.message);
}

export async function getTemplateById(id: string): Promise<EmailTemplateRecord | null> {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from('email_templates')
    .select('id, template_type, name, subject, body_html, is_system, updated_at')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    templateType: (data.template_type as EmailTemplateType | null) ?? null,
    name: data.name,
    subject: data.subject,
    bodyHtml: data.body_html,
    isSystem: data.is_system,
    updatedAt: data.updated_at,
  };
}
