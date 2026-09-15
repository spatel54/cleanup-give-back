"use client";

/**
 * Minimal WYSIWYG email-body editor - Admin edits formatted text, never raw
 * HTML. Zero-dependency `contentEditable` + `document.execCommand` for the
 * toolbar (bold/italic/underline/lists/link/image/font/size/color); paste and
 * preview run through `sanitizeEmailHtml`. Personalization chips use
 * `data-var` spans inserted via `insertHtml`.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import {
  BoldIcon,
  EraserIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  UnderlineIcon,
} from "@/components/ui/Icons";
import { sanitizeEmailHtml } from "@/lib/sanitize-html";

const ALLOWED_LINK_SCHEMES = ["http:", "https:", "mailto:"];

const FONT_FAMILIES = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Verdana",
  "Courier New",
  "Trebuchet MS",
] as const;

const FONT_SIZES = [
  { label: "12", px: "12px" },
  { label: "14", px: "14px" },
  { label: "16", px: "16px" },
  { label: "18", px: "18px" },
  { label: "24", px: "24px" },
] as const;

const SELECT_CHEVRON_STYLE = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%233e4a3d' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")`,
} as const;

const SELECT_CLASS =
  "h-8 pl-sm pr-8 rounded-sm border border-border-outline bg-bg-app font-data text-[11px] text-text-primary appearance-none bg-no-repeat bg-[length:12px_12px] bg-[position:right_8px_center]";

function ToolbarBtn({
  label,
  icon: Icon,
  onPress,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPress}
      aria-label={label}
      title={label}
      className="w-8 h-8 inline-flex items-center justify-center rounded-sm text-text-tertiary hover:bg-bg-app hover:text-text-primary transition-colors"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export type RichTextEditorHandle = {
  insertHtml: (html: string) => void;
  focus: () => void;
};

export const RichTextEditor = forwardRef<
  RichTextEditorHandle,
  {
    value: string;
    onChange: (html: string) => void;
    onUploadImage?: (file: File) => Promise<string>;
    placeholder?: string;
  }
>(function RichTextEditor({ value, onChange, onUploadImage, placeholder = "Write your message…" }, ref) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = sanitizeEmailHtml(value);
      lastValueRef.current = value;
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? "";
    lastValueRef.current = html;
    onChange(html);
  }, [onChange]);

  const exec = useCallback(
    (command: string, arg?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, arg);
      emitChange();
    },
    [emitChange],
  );

  const insertHtml = useCallback(
    (html: string) => {
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, sanitizeEmailHtml(html));
      emitChange();
    },
    [emitChange],
  );

  useImperativeHandle(
    ref,
    () => ({
      insertHtml,
      focus: () => editorRef.current?.focus(),
    }),
    [insertHtml],
  );

  const handleLink = useCallback(() => {
    const url = window.prompt("Link URL");
    if (!url) return;
    let parsed: URL;
    try {
      parsed = new URL(url, window.location.origin);
    } catch {
      window.alert("That doesn't look like a valid URL.");
      return;
    }
    if (!ALLOWED_LINK_SCHEMES.includes(parsed.protocol)) {
      window.alert("Only http(s) and mailto links are allowed.");
      return;
    }
    exec("createLink", parsed.toString());
  }, [exec]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const html = e.clipboardData.getData("text/html");
      const text = e.clipboardData.getData("text/plain");
      const safe = html
        ? sanitizeEmailHtml(html)
        : text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, safe);
      emitChange();
    },
    [emitChange],
  );

  const handleImagePick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !onUploadImage) return;
      try {
        const url = await onUploadImage(file);
        exec("insertImage", url);
      } catch (err) {
        console.error("[RichTextEditor] image upload failed:", err);
        window.alert("Image upload failed - please try again.");
      }
    },
    [exec, onUploadImage],
  );

  const applyFontSize = useCallback(
    (px: string) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        insertHtml(`<span style="font-size: ${px}">&#8203;</span>`);
        return;
      }
      const range = selection.getRangeAt(0);
      const span = document.createElement("span");
      span.style.fontSize = px;
      try {
        range.surroundContents(span);
      } catch {
        const frag = range.extractContents();
        span.appendChild(frag);
        range.insertNode(span);
      }
      emitChange();
    },
    [emitChange, insertHtml],
  );

  const isEmpty = !value || value === "<br>" || value === "<div><br></div>";

  return (
    <div className="border border-border-outline rounded-sm overflow-hidden bg-bg-app">
      <div className="flex items-center gap-xs px-sm py-xs border-b border-border-outline bg-bg-surface-elevated flex-wrap">
        <select
          aria-label="Font"
          defaultValue=""
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.value) exec("fontName", e.target.value);
            e.target.value = "";
          }}
          className={SELECT_CLASS}
          style={SELECT_CHEVRON_STYLE}
        >
          <option value="" disabled>
            Font
          </option>
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          aria-label="Font size"
          defaultValue=""
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.value) applyFontSize(e.target.value);
            e.target.value = "";
          }}
          className={SELECT_CLASS}
          style={SELECT_CHEVRON_STYLE}
        >
          <option value="" disabled>
            Size
          </option>
          {FONT_SIZES.map((s) => (
            <option key={s.px} value={s.px}>
              {s.label}
            </option>
          ))}
        </select>
        <label
          className="w-8 h-8 inline-flex items-center justify-center rounded-sm text-text-tertiary hover:bg-bg-app cursor-pointer"
          title="Text color"
          aria-label="Text color"
        >
          <input
            type="color"
            defaultValue="#1a1c19"
            className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer"
            onMouseDown={(e) => e.preventDefault()}
            onChange={(e) => exec("foreColor", e.target.value)}
          />
        </label>
        <ToolbarBtn label="Bold" icon={BoldIcon} onPress={() => exec("bold")} />
        <ToolbarBtn label="Italic" icon={ItalicIcon} onPress={() => exec("italic")} />
        <ToolbarBtn label="Underline" icon={UnderlineIcon} onPress={() => exec("underline")} />
        <ToolbarBtn label="Bullet list" icon={ListIcon} onPress={() => exec("insertUnorderedList")} />
        <ToolbarBtn label="Numbered list" icon={ListOrderedIcon} onPress={() => exec("insertOrderedList")} />
        <ToolbarBtn label="Link" icon={LinkIcon} onPress={handleLink} />
        {onUploadImage && <ToolbarBtn label="Image" icon={ImageIcon} onPress={handleImagePick} />}
        <ToolbarBtn label="Clear formatting" icon={EraserIcon} onPress={() => exec("removeFormat")} />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
      </div>
      <div className="relative">
        {isEmpty && (
          <span className="pointer-events-none absolute top-sm left-md font-body text-[14px] text-text-tertiary">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-label="Email body"
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={emitChange}
          onPaste={handlePaste}
          className="min-h-[220px] max-h-[480px] overflow-y-auto px-md py-sm font-body text-[14px] text-text-primary focus-visible:outline-none [&_ul]:list-disc [&_ul]:pl-lg [&_ol]:list-decimal [&_ol]:pl-lg [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-sm [&_.email-token]:inline-flex [&_.email-token]:items-center [&_.email-token]:px-1.5 [&_.email-token]:py-0.5 [&_.email-token]:mx-0.5 [&_.email-token]:rounded-sm [&_.email-token]:bg-primary/10 [&_.email-token]:text-primary [&_.email-token]:font-data [&_.email-token]:text-[12px] [&_.email-token]:font-semibold [&_.email-token]:select-none"
        />
      </div>
    </div>
  );
});

/** Renders stored/live HTML the same way the editor's own contentEditable surface would. */
export function RichTextPreview({ html }: { html: string }) {
  return (
    <div
      className="font-body text-[14px] text-text-primary [&_p]:mb-sm [&_ul]:list-disc [&_ul]:pl-lg [&_ol]:list-decimal [&_ol]:pl-lg [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-sm"
      dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(html) }}
    />
  );
}

export const EMAIL_SELECT_CHEVRON_STYLE = SELECT_CHEVRON_STYLE;
export const EMAIL_SELECT_CLASS =
  "h-11 w-full pl-md pr-8 rounded-sm border border-border-outline bg-bg-app font-body text-[13px] text-text-primary appearance-none bg-no-repeat bg-[length:12px_12px] bg-[position:right_12px_center] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
