"use client";

/**
 * `/emails` - Compose (send / schedule), Scheduled (edit / cancel / send now),
 * Templates (natural-language personalization chips). Bodies use RichTextEditor.
 */
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  EMAIL_SELECT_CHEVRON_STYLE,
  EMAIL_SELECT_CLASS,
  RichTextEditor,
  RichTextPreview,
  type RichTextEditorHandle,
} from "@/components/ui/RichTextEditor";
import { CloseIcon, PaperclipIcon, PencilIcon, PlusIcon, SendIcon, TrashIcon } from "@/components/ui/Icons";
import { sendAdHocEmail } from "@/actions/emails";
import { createTemplate, deleteTemplate, updateEmailTemplate, updateTemplate } from "@/actions/emailTemplates";
import {
  uploadEmailAttachment,
  uploadEmailInlineImage,
  removeEmailAttachment,
  type UploadedAttachment,
} from "@/actions/emailAttachments";
import {
  cancelScheduledEmail,
  scheduleAdHocEmail,
  sendScheduledEmailNow,
  updateScheduledEmail,
} from "@/actions/scheduledEmails";
import {
  renderTemplate,
  EMAIL_TEMPLATE_VARIABLES,
  EMAIL_TEMPLATE_SAMPLE_DATA,
  type EmailTemplateType,
} from "@/lib/email-template-render";
import {
  chipHtml,
  CUSTOM_TEMPLATE_INSERT_VARS,
  fromEditorHtml,
  fromEditorSubject,
  labelForVariable,
  toEditorHtml,
} from "@/lib/email-template-tokens";
import type { EmailTemplateRecord } from "@/lib/email-templates";
import type { ScheduledEmail } from "@/lib/scheduled-emails";
import { isValidEmail } from "@/lib/email-address";

type Volunteer = {
  id: string;
  name: string;
  email: string;
  isMockEmail?: boolean;
  trackingNumber?: string | null;
  carrier?: string | null;
};
type Tab = "compose" | "scheduled" | "templates";
type Recipient =
  | { kind: "volunteer"; id: string; name: string; email: string; isMockEmail?: boolean }
  | { kind: "custom"; email: string };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatScheduledWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function uploadInlineImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  return uploadEmailInlineImage(formData);
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`h-11 inline-flex items-center px-lg rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors ${
        active
          ? "bg-primary text-white border-primary"
          : "bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function FromLine({ fromAddress }: { fromAddress: string }) {
  return (
    <div>
      <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">From</label>
      <div className="h-11 px-md rounded-sm border border-border-outline bg-bg-surface-elevated flex items-center">
        <span className="font-body text-[14px] text-text-primary">{fromAddress}</span>
      </div>
      <p className="mt-xs font-body text-[12px] text-text-tertiary">
        Sent as Clean Up Give Back from this address (set via EMAIL_FROM).
      </p>
    </div>
  );
}

function RecipientPicker({
  label,
  volunteers,
  value,
  onChange,
}: {
  label: string;
  volunteers: Volunteer[];
  value: Recipient | null;
  onChange: (next: Recipient | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const sortedVolunteers = useMemo(
    () => [...volunteers].sort((a, b) => a.name.localeCompare(b.name)),
    [volunteers],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sortedVolunteers;
    return sortedVolunteers.filter(
      (v) => v.name.toLowerCase().includes(needle) || v.email.toLowerCase().includes(needle),
    );
  }, [query, sortedVolunteers]);

  const trimmed = query.trim();
  const canUseCustom = isValidEmail(trimmed);

  if (value) {
    return (
      <div>
        <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">{label}</label>
        <div className="flex items-center gap-sm h-11 px-md rounded-sm border border-border-outline bg-bg-app w-fit max-w-full">
          <span className="font-body text-[14px] text-text-primary truncate">
            {value.kind === "volunteer" ? (
              <>
                {value.name}{" "}
                <span className="text-text-tertiary">
                  ({value.isMockEmail ? "no email on file" : value.email})
                </span>
              </>
            ) : (
              value.email
            )}
          </span>
          <button type="button" onClick={() => onChange(null)} aria-label={`Clear ${label}`}>
            <CloseIcon className="w-3.5 h-3.5 text-text-tertiary" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">{label}</label>
      <div className="relative">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canUseCustom) {
              e.preventDefault();
              onChange({ kind: "custom", email: trimmed });
              setQuery("");
              setOpen(false);
            }
          }}
          placeholder="Search volunteers or type an email…"
          className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-app font-body text-[14px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        />
        {open && (filtered.length > 0 || canUseCustom) && (
          <ul className="absolute z-10 mt-xs w-full max-h-64 overflow-y-auto bg-bg-surface border border-border-outline rounded-sm shadow-bar-top">
            {filtered.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ kind: "volunteer", id: v.id, name: v.name, email: v.email, isMockEmail: v.isMockEmail });
                    setQuery("");
                    setOpen(false);
                  }}
                  className="w-full text-left px-md py-sm hover:bg-bg-app transition-colors"
                >
                  <p className="font-body text-[13px] text-text-primary">{v.name}</p>
                  <p className="font-data text-[11px] text-text-tertiary">
                    {v.isMockEmail ? "No email on file yet" : v.email}
                  </p>
                </button>
              </li>
            ))}
            {canUseCustom && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ kind: "custom", email: trimmed });
                    setQuery("");
                    setOpen(false);
                  }}
                  className="w-full text-left px-md py-sm hover:bg-bg-app transition-colors border-t border-border-outline"
                >
                  <p className="font-body text-[13px] text-text-primary">Use {trimmed}</p>
                  <p className="font-data text-[11px] text-text-tertiary">Custom email</p>
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmailChipList({
  label,
  volunteers,
  emails,
  onChange,
}: {
  label: string;
  volunteers: Volunteer[];
  emails: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const taken = new Set(emails.map((e) => e.toLowerCase()));
    return volunteers
      .filter((v) => !taken.has(v.email.toLowerCase()))
      .filter((v) => !needle || v.name.toLowerCase().includes(needle) || v.email.toLowerCase().includes(needle))
      .slice(0, 6);
  }, [query, volunteers, emails]);

  function addEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized) || emails.some((e) => e.toLowerCase() === normalized)) return;
    onChange([...emails, normalized]);
    setQuery("");
    setOpen(false);
  }

  return (
    <div>
      <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">{label}</label>
      <div className="flex flex-wrap gap-xs mb-xs">
        {emails.map((email) => (
          <span
            key={email}
            className="inline-flex items-center gap-xs h-8 px-sm rounded-full border border-border-outline bg-bg-app font-body text-[12px] text-text-primary"
          >
            {email}
            <button type="button" onClick={() => onChange(emails.filter((e) => e !== email))} aria-label={`Remove ${email}`}>
              <CloseIcon className="w-3 h-3 text-text-tertiary" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addEmail(query.replace(/,/g, ""));
            }
          }}
          placeholder="Add email or search volunteer…"
          className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-app font-body text-[14px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        />
        {open && (filtered.length > 0 || isValidEmail(query.trim())) && (
          <ul className="absolute z-10 mt-xs w-full max-h-48 overflow-y-auto bg-bg-surface border border-border-outline rounded-sm shadow-bar-top">
            {filtered.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => addEmail(v.email)}
                  className="w-full text-left px-md py-sm hover:bg-bg-app transition-colors"
                >
                  <p className="font-body text-[13px] text-text-primary">{v.name}</p>
                  <p className="font-data text-[11px] text-text-tertiary">{v.email}</p>
                </button>
              </li>
            ))}
            {isValidEmail(query.trim()) && (
              <li>
                <button
                  type="button"
                  onClick={() => addEmail(query.trim())}
                  className="w-full text-left px-md py-sm hover:bg-bg-app transition-colors"
                >
                  Add {query.trim()}
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function SubjectTokenField({
  value,
  onChange,
  onInsertRef,
}: {
  value: string;
  onChange: (html: string) => void;
  onInsertRef?: React.MutableRefObject<((html: string) => void) | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef(value);

  useEffect(() => {
    if (ref.current && value !== last.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
      last.current = value;
    }
  }, [value]);

  const emit = useCallback(() => {
    const html = ref.current?.innerHTML ?? "";
    last.current = html;
    onChange(html);
  }, [onChange]);

  useEffect(() => {
    if (!onInsertRef) return;
    onInsertRef.current = (html: string) => {
      ref.current?.focus();
      document.execCommand("insertHTML", false, html);
      emit();
    };
    return () => {
      onInsertRef.current = null;
    };
  }, [onInsertRef, emit]);

  return (
    <div
      ref={ref}
      role="textbox"
      aria-label="Subject"
      contentEditable
      suppressContentEditableWarning
      onInput={emit}
      onBlur={emit}
      className="w-full min-h-11 px-md py-sm rounded-sm border border-border-outline bg-bg-app font-body text-[14px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary [&_.email-token]:inline-flex [&_.email-token]:items-center [&_.email-token]:px-1.5 [&_.email-token]:py-0.5 [&_.email-token]:mx-0.5 [&_.email-token]:rounded-sm [&_.email-token]:bg-primary/10 [&_.email-token]:text-primary [&_.email-token]:font-data [&_.email-token]:text-[12px] [&_.email-token]:font-semibold"
    />
  );
}

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour24 = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  const pad = (n: number) => String(n).padStart(2, "0");
  const value = `${pad(hour24)}:${pad(minute)}`;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const label = `${hour12}:${pad(minute)} ${hour24 < 12 ? "AM" : "PM"}`;
  return { value, label };
});

function ScheduleDateTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [timeOpen, setTimeOpen] = useState(false);
  const [datePart, timePart] = value ? value.split("T") : ["", ""];
  const selectedTime = TIME_OPTIONS.find((t) => t.value === timePart);

  function setDatePart(next: string) {
    onChange(`${next}T${timePart || "09:00"}`);
  }

  function setTimePart(next: string) {
    if (!datePart) return;
    onChange(`${datePart}T${next}`);
  }

  return (
    <div className="flex flex-wrap gap-md">
      <div>
        <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">Date</label>
        <input
          type="date"
          value={datePart}
          onChange={(e) => setDatePart(e.target.value)}
          className="h-11 px-md rounded-sm border border-border-outline bg-bg-app font-body text-[14px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        />
      </div>
      <div className="relative">
        <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">Time</label>
        <button
          type="button"
          disabled={!datePart}
          onClick={() => setTimeOpen((o) => !o)}
          onBlur={() => setTimeout(() => setTimeOpen(false), 150)}
          className="w-32 h-11 px-md rounded-sm border border-border-outline bg-bg-app font-body text-[14px] text-text-primary text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
        >
          {selectedTime?.label ?? "Select…"}
        </button>
        {timeOpen && (
          <ul className="absolute z-10 mt-xs w-32 max-h-64 overflow-y-auto bg-bg-surface border border-border-outline rounded-sm shadow-bar-top">
            {TIME_OPTIONS.map((t) => (
              <li key={t.value}>
                <button
                  type="button"
                  onClick={() => {
                    setTimePart(t.value);
                    setTimeOpen(false);
                  }}
                  className={`w-full text-left px-md py-sm hover:bg-bg-app transition-colors font-body text-[13px] ${
                    t.value === timePart ? "text-primary font-semibold" : "text-text-primary"
                  }`}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ComposeTab({
  templates,
  volunteers,
  fromAddress,
  initialRecipientId,
}: {
  templates: EmailTemplateRecord[];
  volunteers: Volunteer[];
  fromAddress: string;
  initialRecipientId?: string;
}) {
  const [to, setTo] = useState<Recipient | null>(() => {
    if (!initialRecipientId) return null;
    const match = volunteers.find((v) => v.id === initialRecipientId);
    return match ? { kind: "volunteer", id: match.id, name: match.name, email: match.email } : null;
  });
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [isSending, startSending] = useTransition();
  const [sendResult, setSendResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const activeTemplate = templates.find((t) => t.id === activeTemplateId) ?? null;
  const activeTemplateVars =
    activeTemplate?.templateType != null ? EMAIL_TEMPLATE_VARIABLES[activeTemplate.templateType] : [];
  const needsTrackingFields = activeTemplateVars.includes("tracking_number");

  function applyTemplate(templateId: string, overrides?: { trackingNumber?: string; carrier?: string }) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setActiveTemplateId(templateId);

    const volunteerRecord = to?.kind === "volunteer" ? volunteers.find((v) => v.id === to.id) : null;
    const autoTrackingNumber = volunteerRecord?.trackingNumber ?? "";
    const autoCarrier = volunteerRecord?.carrier ?? "";
    const nextTrackingNumber = overrides?.trackingNumber ?? autoTrackingNumber;
    const nextCarrier = overrides?.carrier ?? autoCarrier;
    setTrackingNumber(nextTrackingNumber);
    setCarrier(nextCarrier);

    const vars = {
      volunteer_name: to?.kind === "volunteer" ? to.name : "",
      tracking_number: nextTrackingNumber.trim() || "[blank]",
      carrier: nextCarrier.trim() || "[blank]",
    };
    setSubject(renderTemplate(template.subject, vars));
    setBodyHtml(renderTemplate(template.bodyHtml, vars, { escapeHtml: true }));
  }

  /** Re-applies the active template (if any) whenever the recipient changes, so
   * switching volunteers keeps tracking number/carrier - and volunteer_name -
   * in sync instead of leaving stale values from the previous recipient. */
  function handleRecipientChange(next: Recipient | null) {
    setTo(next);
    if (!activeTemplateId) return;
    const template = templates.find((t) => t.id === activeTemplateId);
    if (!template) return;

    const volunteerRecord = next?.kind === "volunteer" ? volunteers.find((v) => v.id === next.id) : null;
    const autoTrackingNumber = volunteerRecord?.trackingNumber ?? "";
    const autoCarrier = volunteerRecord?.carrier ?? "";
    setTrackingNumber(autoTrackingNumber);
    setCarrier(autoCarrier);

    const vars = {
      volunteer_name: next?.kind === "volunteer" ? next.name : "",
      tracking_number: autoTrackingNumber.trim() || "[blank]",
      carrier: autoCarrier.trim() || "[blank]",
    };
    setSubject(renderTemplate(template.subject, vars));
    setBodyHtml(renderTemplate(template.bodyHtml, vars, { escapeHtml: true }));
  }

  async function handleAttachmentPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploadingAttachment(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const uploaded = await uploadEmailAttachment(formData);
        setAttachments((prev) => [...prev, uploaded]);
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Attachment upload failed");
    } finally {
      setUploadingAttachment(false);
    }
  }

  function clearForm() {
    setSubject("");
    setBodyHtml("");
    setAttachments([]);
    setTo(null);
    setCc([]);
    setBcc([]);
    setShowCc(false);
    setShowBcc(false);
    setScheduleAt("");
    setShowSchedule(false);
  }

  function recipientPayload() {
    return {
      recipientUserId: to?.kind === "volunteer" ? to.id : undefined,
      toEmail: to?.kind === "custom" ? to.email : undefined,
    };
  }

  function handleSend() {
    setSendResult(null);
    setStatusNote(null);
    startSending(async () => {
      try {
        const result = await sendAdHocEmail({
          ...recipientPayload(),
          ccEmails: cc,
          bccEmails: bcc,
          subject,
          bodyHtml,
          attachments: attachments.map((a) => ({ path: a.path, filename: a.filename })),
        });
        setSendResult(result);
        if (result.ok) {
          clearForm();
          setStatusNote("Email sent");
        }
      } catch (err) {
        setSendResult({ ok: false, error: err instanceof Error ? err.message : "Failed to send" });
      }
    });
  }

  function handleSchedule() {
    setSendResult(null);
    setStatusNote(null);
    if (!scheduleAt) {
      setSendResult({ ok: false, error: "Pick a send time" });
      return;
    }
    startSending(async () => {
      try {
        const result = await scheduleAdHocEmail({
          ...recipientPayload(),
          ccEmails: cc,
          bccEmails: bcc,
          subject,
          bodyHtml,
          attachments: attachments.map((a) => ({ path: a.path, filename: a.filename })),
          scheduledFor: new Date(scheduleAt).toISOString(),
        });
        if (result.ok) {
          clearForm();
          setSendResult({ ok: true, error: undefined });
          setStatusNote("Email scheduled");
          router.refresh();
        } else {
          setSendResult({ ok: false, error: result.error });
        }
      } catch (err) {
        setSendResult({ ok: false, error: err instanceof Error ? err.message : "Failed to schedule" });
      }
    });
  }

  const toIsMock = to?.kind === "volunteer" && to.isMockEmail === true;

  const canSend =
    subject.trim().length > 0 && bodyHtml.trim().length > 0 && to != null && !toIsMock;

  const missingFields = [
    !to && "a recipient",
    toIsMock && "a volunteer with a real email on file",
    !subject.trim() && "a subject",
    !bodyHtml.trim() && "a message",
  ].filter((v): v is string => Boolean(v));

  const tzHint = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "local time";
    }
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-lg items-start">
      <div className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md">
        <FromLine fromAddress={fromAddress} />
        <RecipientPicker label="To" volunteers={volunteers} value={to} onChange={handleRecipientChange} />
        {showCc ? (
          <EmailChipList label="Cc (optional)" volunteers={volunteers} emails={cc} onChange={setCc} />
        ) : null}
        {showBcc ? (
          <EmailChipList label="Bcc (optional)" volunteers={volunteers} emails={bcc} onChange={setBcc} />
        ) : null}
        {(!showCc || !showBcc) && (
          <div className="flex items-center gap-md">
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="self-start font-data text-[11px] font-semibold text-primary hover:underline"
              >
                Add Cc
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                onClick={() => setShowBcc(true)}
                className="self-start font-data text-[11px] font-semibold text-primary hover:underline"
              >
                Add Bcc
              </button>
            )}
          </div>
        )}

        {templates.length > 0 && (
          <div>
            <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">
              Start from a template (optional)
            </label>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) applyTemplate(e.target.value);
                e.target.value = "";
              }}
              className={EMAIL_SELECT_CLASS}
              style={EMAIL_SELECT_CHEVRON_STYLE}
            >
              <option value="" disabled>
                Choose a template…
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.isSystem ? `System · ${t.name}` : t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {needsTrackingFields && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm rounded-sm border border-border-outline bg-bg-app p-md">
            <div>
              <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">
                Tracking number
              </label>
              <input
                value={trackingNumber}
                onChange={(e) => activeTemplateId && applyTemplate(activeTemplateId, { trackingNumber: e.target.value, carrier })}
                placeholder="e.g. 1Z999AA10123456784"
                className="w-full h-9 px-sm rounded-sm border border-border-outline bg-bg-surface font-body text-[13px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
            <div>
              <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">
                Carrier
              </label>
              <input
                value={carrier}
                onChange={(e) => activeTemplateId && applyTemplate(activeTemplateId, { trackingNumber, carrier: e.target.value })}
                placeholder="e.g. UPS"
                className="w-full h-9 px-sm rounded-sm border border-border-outline bg-bg-surface font-body text-[13px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
            <p className="sm:col-span-2 font-body text-[11px] text-text-tertiary">
              {trackingNumber
                ? "Auto-filled from this volunteer's latest order - edit if needed, and the subject/body update automatically."
                : "No tracking number on file for this volunteer's orders yet - enter one manually, or leave blank to send without a tracking line."}
            </p>
          </div>
        )}

        <div>
          <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-app font-body text-[14px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          />
        </div>

        <div>
          <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">Message</label>
          <RichTextEditor value={bodyHtml} onChange={setBodyHtml} onUploadImage={uploadInlineImage} />
        </div>

        <div>
          <div className="flex items-center gap-sm mb-xs">
            <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary">Attachments (optional)</label>
            <button
              type="button"
              onClick={() => attachmentInputRef.current?.click()}
              disabled={uploadingAttachment}
              className="inline-flex items-center gap-xs h-7 px-sm rounded-sm border border-border-outline font-data text-[11px] font-semibold text-text-tertiary hover:bg-bg-app transition-colors disabled:opacity-50"
            >
              <PaperclipIcon className="w-3.5 h-3.5" />
              {uploadingAttachment ? "Uploading…" : "Attach files"}
            </button>
            <input ref={attachmentInputRef} type="file" multiple className="hidden" onChange={handleAttachmentPick} />
          </div>
          {attachments.length > 0 && (
            <ul className="flex flex-col gap-xs">
              {attachments.map((a) => (
                <li key={a.path} className="flex items-center justify-between gap-sm px-sm py-xs rounded-sm bg-bg-app">
                  <span className="font-body text-[12px] text-text-primary truncate">
                    {a.filename} <span className="text-text-tertiary">({formatBytes(a.sizeBytes)})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachments((prev) => prev.filter((x) => x.path !== a.path));
                      void removeEmailAttachment(a.path);
                    }}
                    aria-label={`Remove ${a.filename}`}
                  >
                    <CloseIcon className="w-3.5 h-3.5 text-text-tertiary" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {showSchedule && (
          <div>
            <p className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs">
              Send at ({tzHint})
            </p>
            <ScheduleDateTimePicker value={scheduleAt} onChange={setScheduleAt} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-md">
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || isSending || showSchedule}
            className="inline-flex items-center gap-sm h-11 px-lg rounded-full bg-primary text-white font-data text-[12px] font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            <SendIcon className="w-4 h-4" />
            {isSending && !showSchedule ? "Sending…" : "Send"}
          </button>
          {!showSchedule ? (
            <button
              type="button"
              onClick={() => setShowSchedule(true)}
              disabled={!canSend || isSending}
              className="inline-flex items-center gap-sm h-11 px-lg rounded-full border border-border-outline font-data text-[12px] font-semibold text-text-primary hover:bg-bg-app transition-colors disabled:opacity-50"
            >
              Schedule send
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSchedule}
                disabled={!canSend || isSending || !scheduleAt}
                className="inline-flex items-center gap-sm h-11 px-lg rounded-full bg-primary text-white font-data text-[12px] font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {isSending ? "Scheduling…" : "Confirm schedule"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSchedule(false);
                  setScheduleAt("");
                }}
                className="font-data text-[12px] font-semibold text-text-tertiary hover:text-text-primary"
              >
                Cancel
              </button>
            </>
          )}
          {(sendResult || statusNote) && (
            <span
              className={`font-body text-[13px] ${
                sendResult && !sendResult.ok ? "text-[#ba1a1a]" : "text-primary"
              }`}
            >
              {sendResult && !sendResult.ok ? sendResult.error : statusNote}
            </span>
          )}
        </div>
        {!canSend && missingFields.length > 0 && (
          <p className="font-body text-[12px] text-text-tertiary">
            Add {missingFields.join(", ")} to send or schedule.
          </p>
        )}
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
        <p className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-md">Preview</p>
        <div className="border border-border-outline rounded-sm overflow-hidden">
          <div className="px-md py-sm bg-bg-surface-elevated border-b border-border-outline space-y-xs">
            <p className="font-data text-[11px] text-text-tertiary">
              From <span className="text-text-primary">{fromAddress}</span>
            </p>
            <p className="font-body text-[13px] font-medium text-text-primary truncate">{subject || "(no subject)"}</p>
          </div>
          <div className="px-md py-md">
            {bodyHtml ? <RichTextPreview html={bodyHtml} /> : <p className="font-body text-[13px] text-text-tertiary">(empty)</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditScheduledDrawer({
  row,
  volunteers,
  fromAddress,
  onClose,
  onSaved,
}: {
  row: ScheduledEmail;
  volunteers: Volunteer[];
  fromAddress: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initialVolunteer = volunteers.find((v) => v.id === row.userId);
  const [to, setTo] = useState<Recipient | null>(
    initialVolunteer
      ? { kind: "volunteer", id: initialVolunteer.id, name: initialVolunteer.name, email: initialVolunteer.email }
      : { kind: "custom", email: row.toEmail },
  );
  const [cc, setCc] = useState(row.ccEmails);
  const [bcc, setBcc] = useState(row.bccEmails);
  const [showCc, setShowCc] = useState(row.ccEmails.length > 0);
  const [showBcc, setShowBcc] = useState(row.bccEmails.length > 0);
  const [subject, setSubject] = useState(row.subject);
  const [bodyHtml, setBodyHtml] = useState(row.bodyHtml);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>(
    row.attachments.map((a) => ({ path: a.path, filename: a.filename, sizeBytes: 0 })),
  );
  const [scheduleAt, setScheduleAt] = useState(toDatetimeLocalValue(row.scheduledFor));
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    setError(null);
    startSaving(async () => {
      try {
        const result = await updateScheduledEmail({
          id: row.id,
          recipientUserId: to?.kind === "volunteer" ? to.id : undefined,
          toEmail: to?.kind === "custom" ? to.email : undefined,
          ccEmails: cc,
          bccEmails: bcc,
          subject,
          bodyHtml,
          attachments: attachments.map((a) => ({ path: a.path, filename: a.filename })),
          scheduledFor: new Date(scheduleAt).toISOString(),
        });
        if (!result.ok) {
          setError(result.error ?? "Failed to save");
          return;
        }
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-md" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md">
        <div className="flex items-center justify-between gap-md">
          <h2 className="font-heading text-[20px] text-text-primary">Edit scheduled email</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <CloseIcon className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>
        <FromLine fromAddress={fromAddress} />
        <RecipientPicker label="To" volunteers={volunteers} value={to} onChange={setTo} />
        {showCc ? (
          <EmailChipList label="Cc (optional)" volunteers={volunteers} emails={cc} onChange={setCc} />
        ) : null}
        {showBcc ? (
          <EmailChipList label="Bcc (optional)" volunteers={volunteers} emails={bcc} onChange={setBcc} />
        ) : null}
        {(!showCc || !showBcc) && (
          <div className="flex items-center gap-md">
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="self-start font-data text-[11px] font-semibold text-primary hover:underline"
              >
                Add Cc
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                onClick={() => setShowBcc(true)}
                className="self-start font-data text-[11px] font-semibold text-primary hover:underline"
              >
                Add Bcc
              </button>
            )}
          </div>
        )}
        <div>
          <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-app font-body text-[14px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          />
        </div>
        <RichTextEditor value={bodyHtml} onChange={setBodyHtml} onUploadImage={uploadInlineImage} />
        <div>
          <p className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs">Send at</p>
          <ScheduleDateTimePicker value={scheduleAt} onChange={setScheduleAt} />
        </div>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={() => attachmentInputRef.current?.click()}
            className="inline-flex items-center gap-xs h-8 px-sm rounded-sm border border-border-outline font-data text-[11px] font-semibold text-text-tertiary"
          >
            <PaperclipIcon className="w-3.5 h-3.5" /> Attach
          </button>
          <input
            ref={attachmentInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                const uploaded = await uploadEmailAttachment(formData);
                setAttachments((prev) => [...prev, uploaded]);
              }
            }}
          />
          {attachments.map((a) => (
            <span key={a.path} className="font-data text-[11px] text-text-tertiary">
              {a.filename}
            </span>
          ))}
        </div>
        {error && <p className="font-body text-[13px] text-[#ba1a1a]">{error}</p>}
        <div className="flex items-center gap-md">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !to || !subject.trim() || !bodyHtml.trim() || !scheduleAt}
            className="h-11 px-lg rounded-full bg-primary text-white font-data text-[12px] font-semibold disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
          <button type="button" onClick={onClose} className="font-data text-[12px] font-semibold text-text-tertiary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduledTab({
  rows,
  volunteers,
  fromAddress,
}: {
  rows: ScheduledEmail[];
  volunteers: Volunteer[];
  fromAddress: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<ScheduledEmail | null>(null);
  const [pending, startPending] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function runAction(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    setMessage(null);
    startPending(async () => {
      const result = await fn();
      setMessage(result.ok ? okMsg : result.error ?? "Failed");
      router.refresh();
    });
  }

  return (
    <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
      <div className="px-lg py-md border-b border-border-outline flex items-center justify-between gap-md">
        <div>
          <p className="font-body text-[14px] text-text-primary">Scheduled emails</p>
          <p className="font-body text-[12px] text-text-tertiary">From {fromAddress} · pending can be edited, sent now, or cancelled</p>
        </div>
        {message && <span className="font-body text-[13px] text-text-tertiary">{message}</span>}
      </div>
      {rows.length === 0 ? (
        <p className="p-lg font-body text-[13px] text-text-tertiary">No scheduled emails yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-outline font-data text-[11px] uppercase tracking-[0.6px] text-text-tertiary">
                <th className="px-md py-sm font-semibold">When</th>
                <th className="px-md py-sm font-semibold">To</th>
                <th className="px-md py-sm font-semibold">Cc / Bcc</th>
                <th className="px-md py-sm font-semibold">Subject</th>
                <th className="px-md py-sm font-semibold">Status</th>
                <th className="px-md py-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border-outline last:border-0 align-top">
                  <td className="px-md py-sm font-body text-[13px] text-text-primary whitespace-nowrap">
                    {formatScheduledWhen(row.scheduledFor)}
                  </td>
                  <td className="px-md py-sm font-body text-[13px] text-text-primary">{row.toEmail}</td>
                  <td className="px-md py-sm font-body text-[12px] text-text-tertiary">
                    {row.ccEmails.length || row.bccEmails.length
                      ? `Cc ${row.ccEmails.length} · Bcc ${row.bccEmails.length}`
                      : "-"}
                  </td>
                  <td className="px-md py-sm font-body text-[13px] text-text-primary max-w-[220px] truncate">{row.subject}</td>
                  <td className="px-md py-sm font-data text-[11px] font-semibold uppercase text-text-tertiary">
                    {row.status}
                    {row.status === "failed" && row.errorMessage ? (
                      <span className="block normal-case font-body text-[11px] text-[#ba1a1a] mt-xs">{row.errorMessage}</span>
                    ) : null}
                  </td>
                  <td className="px-md py-sm">
                    {row.status === "pending" ? (
                      <div className="flex flex-wrap gap-xs">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => setEditing(row)}
                          className="h-8 px-sm rounded-full border border-border-outline font-data text-[11px] font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => runAction(() => sendScheduledEmailNow(row.id), "Sent")}
                          className="h-8 px-sm rounded-full bg-primary text-white font-data text-[11px] font-semibold"
                        >
                          Send now
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => runAction(() => cancelScheduledEmail(row.id), "Cancelled")}
                          className="h-8 px-sm rounded-full border border-[#ba1a1a]/40 text-[#ba1a1a] font-data text-[11px] font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="font-body text-[12px] text-text-tertiary">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <EditScheduledDrawer
          row={editing}
          volunteers={volunteers}
          fromAddress={fromAddress}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function TemplatesTab({ templates }: { templates: EmailTemplateRecord[] }) {
  const initial = templates[0] ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(initial?.id ?? null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [draftName, setDraftName] = useState(initial?.name ?? "");
  const [draftSubject, setDraftSubject] = useState(initial ? toEditorHtml(initial.subject) : "");
  const [draftBody, setDraftBody] = useState(initial ? toEditorHtml(initial.bodyHtml) : "");
  const [isSaving, startSaving] = useTransition();
  const [status, setStatus] = useState<{ message: string; kind: "success" | "error" } | null>(null);
  const bodyRef = useRef<RichTextEditorHandle>(null);
  const subjectInsertRef = useRef<((html: string) => void) | null>(null);

  const selected = isCreatingNew ? null : (templates.find((t) => t.id === selectedId) ?? null);

  function selectTemplate(t: EmailTemplateRecord) {
    setIsCreatingNew(false);
    setSelectedId(t.id);
    setDraftName(t.name);
    setDraftSubject(toEditorHtml(t.subject));
    setDraftBody(toEditorHtml(t.bodyHtml));
    setStatus(null);
  }

  function startNewTemplate() {
    setIsCreatingNew(true);
    setSelectedId(null);
    setDraftName("");
    setDraftSubject("");
    setDraftBody("");
    setStatus(null);
  }

  const insertVars = useMemo(() => {
    if (selected?.isSystem && selected.templateType) {
      return EMAIL_TEMPLATE_VARIABLES[selected.templateType as EmailTemplateType] ?? [];
    }
    return [...CUSTOM_TEMPLATE_INSERT_VARS];
  }, [selected]);

  function insertField(varName: string) {
    const html = chipHtml(varName);
    bodyRef.current?.insertHtml(html);
  }

  function insertFieldInSubject(varName: string) {
    subjectInsertRef.current?.(chipHtml(varName));
  }

  function handleSave() {
    setStatus(null);
    const subject = fromEditorSubject(draftSubject);
    const body = fromEditorHtml(draftBody);
    startSaving(async () => {
      try {
        if (isCreatingNew) {
          await createTemplate(draftName, subject, body);
          setStatus({ message: "Template created", kind: "success" });
        } else if (selected?.isSystem && selected.templateType) {
          await updateEmailTemplate(selected.templateType, subject, body);
          setStatus({ message: "Saved", kind: "success" });
        } else if (selected) {
          await updateTemplate(selected.id, draftName, subject, body);
          setStatus({ message: "Saved", kind: "success" });
        }
      } catch (err) {
        setStatus({ message: err instanceof Error ? err.message : "Failed to save", kind: "error" });
      }
    });
  }

  function handleDelete() {
    if (!selected || selected.isSystem) return;
    if (!window.confirm(`Delete "${selected.name}"?`)) return;
    startSaving(async () => {
      try {
        await deleteTemplate(selected.id);
        setSelectedId(null);
        setStatus({ message: "Deleted", kind: "success" });
      } catch (err) {
        setStatus({ message: err instanceof Error ? err.message : "Failed to delete", kind: "error" });
      }
    });
  }

  const sampleVars = useMemo(() => {
    if (selected?.isSystem && selected.templateType) {
      return (
        EMAIL_TEMPLATE_SAMPLE_DATA[selected.templateType as EmailTemplateType] ?? {
          volunteer_name: "Jordan Rivera",
        }
      );
    }
    return { volunteer_name: "Jordan Rivera", activity: "Riverside Park Cleanup" };
  }, [selected]);

  const previewSubject = renderTemplate(fromEditorSubject(draftSubject), sampleVars);
  const previewBody = renderTemplate(fromEditorHtml(draftBody), sampleVars, { escapeHtml: true });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_280px] gap-lg items-start">
      <div className="bg-bg-surface border border-border-outline rounded-md p-md flex flex-col gap-xs">
        <button
          type="button"
          onClick={startNewTemplate}
          className="inline-flex items-center gap-xs h-9 px-sm rounded-sm border border-dashed border-border-outline font-data text-[11px] font-semibold text-text-tertiary hover:border-primary hover:text-primary transition-colors mb-xs"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New template
        </button>
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTemplate(t)}
            className={`text-left px-sm py-xs rounded-sm transition-colors ${
              selectedId === t.id && !isCreatingNew ? "bg-primary/10 text-primary" : "hover:bg-bg-app text-text-primary"
            }`}
          >
            <p className="font-body text-[13px] truncate">{t.name}</p>
            {t.isSystem && <p className="font-data text-[10px] text-text-tertiary uppercase">System</p>}
          </button>
        ))}
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md">
        {!selected && !isCreatingNew ? (
          <p className="font-body text-[13px] text-text-tertiary">Select a template, or create a new one.</p>
        ) : (
          <>
            {(isCreatingNew || !selected?.isSystem) && (
              <div>
                <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">Name</label>
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-app font-body text-[14px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                />
              </div>
            )}
            <div>
              <div className="flex items-center justify-between gap-sm mb-xs">
                <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary">Subject</label>
                <div className="flex flex-wrap gap-xs">
                  {insertVars.map((v) => (
                    <button
                      key={`sub-${v}`}
                      type="button"
                      onClick={() => insertFieldInSubject(v)}
                      className="h-7 px-sm rounded-full border border-border-outline font-data text-[10px] font-semibold text-text-tertiary hover:border-primary hover:text-primary"
                    >
                      + {labelForVariable(v)}
                    </button>
                  ))}
                </div>
              </div>
              <SubjectTokenField value={draftSubject} onChange={setDraftSubject} onInsertRef={subjectInsertRef} />
            </div>
            <div>
              <div className="flex items-center justify-between gap-sm mb-xs">
                <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary">Body</label>
                <div className="flex flex-wrap gap-xs justify-end">
                  {insertVars.map((v) => (
                    <button
                      key={`body-${v}`}
                      type="button"
                      onClick={() => insertField(v)}
                      className="h-7 px-sm rounded-full border border-border-outline font-data text-[10px] font-semibold text-text-tertiary hover:border-primary hover:text-primary"
                    >
                      + {labelForVariable(v)}
                    </button>
                  ))}
                </div>
              </div>
              <RichTextEditor ref={bodyRef} value={draftBody} onChange={setDraftBody} onUploadImage={uploadInlineImage} />
              <p className="mt-xs font-body text-[12px] text-text-tertiary">
                Insert fields with everyday labels (e.g. Volunteer name). No code or brackets needed.
              </p>
            </div>
            <div className="flex items-center gap-md">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !fromEditorSubject(draftSubject) || !fromEditorHtml(draftBody).trim() || (isCreatingNew && !draftName.trim())}
                className="inline-flex items-center gap-sm h-11 px-lg rounded-full bg-primary text-white font-data text-[12px] font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                <PencilIcon className="w-4 h-4" />
                {isSaving ? "Saving…" : isCreatingNew ? "Create template" : "Save"}
              </button>
              {selected && !selected.isSystem && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="inline-flex items-center gap-sm h-11 px-md rounded-full border border-[#ba1a1a]/40 text-[#ba1a1a] font-data text-[12px] font-semibold hover:bg-[#ffd9de] transition-colors disabled:opacity-50"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              )}
              {status && (
                <span className={`font-body text-[13px] ${status.kind === "error" ? "text-[#ba1a1a]" : "text-primary"}`}>
                  {status.message}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
        <p className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-md">Preview - sample data</p>
        <div className="border border-border-outline rounded-sm overflow-hidden">
          <div className="px-md py-sm bg-bg-surface-elevated border-b border-border-outline">
            <p className="font-body text-[13px] font-medium text-text-primary truncate">{previewSubject || "(no subject)"}</p>
          </div>
          <div className="px-md py-md">
            {previewBody ? <RichTextPreview html={previewBody} /> : <p className="font-body text-[13px] text-text-tertiary">(empty)</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmailsPage({
  templates,
  volunteers,
  scheduledEmails,
  fromAddress,
  initialTab,
  initialRecipientId,
}: {
  templates: EmailTemplateRecord[];
  volunteers: Volunteer[];
  scheduledEmails: ScheduledEmail[];
  fromAddress: string;
  initialTab: Tab;
  initialRecipientId?: string;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="max-w-6xl mx-auto p-xl">
      <header className="mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Emails</h1>
        <p className="mt-xs font-body text-[14px] text-text-tertiary">
          Send or schedule email from {fromAddress}, or manage reusable templates.
        </p>
      </header>

      <div className="flex items-center gap-xs mb-lg flex-wrap" role="tablist" aria-label="Emails view">
        <TabButton active={tab === "compose"} onClick={() => setTab("compose")}>
          Compose
        </TabButton>
        <TabButton active={tab === "scheduled"} onClick={() => setTab("scheduled")}>
          Scheduled
        </TabButton>
        <TabButton active={tab === "templates"} onClick={() => setTab("templates")}>
          Templates
        </TabButton>
      </div>

      {tab === "compose" ? (
        <ComposeTab
          templates={templates}
          volunteers={volunteers}
          fromAddress={fromAddress}
          initialRecipientId={initialRecipientId}
        />
      ) : tab === "scheduled" ? (
        <ScheduledTab rows={scheduledEmails} volunteers={volunteers} fromAddress={fromAddress} />
      ) : (
        <TemplatesTab templates={templates} />
      )}
    </div>
  );
}
