/**
 * Reusable post body editor.  It wraps a `<textarea>` with:
 *  - drag-and-drop image attaching (each dropped image is encoded as a
 *    `data:` URI and inserted as inline markdown at the caret position),
 *  - a live "payload size" meter with a warning + hard limit at
 *    `MAX_PAYLOAD_BYTES`,
 *  - a small toolbar button to attach images via the file picker.
 *
 * The component is fully controlled (`value` / `onChange`) and reports its
 * computed payload byte size + an `overLimit` flag through `onSizeChange` so
 * the parent form can disable the submit button.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import {
  MAX_PAYLOAD_BYTES,
  computePayloadBytes,
  fileToDataUrl,
  formatBytes,
  insertAtCaret,
} from "../lib/content";

interface PostBodyEditorProps {
  title: string;
  content: string;
  onContentChange: (content: string) => void;
  /** Existing `createdAt` timestamp when editing; defaults to "now". */
  createdAt?: number;
  onSizeChange?: (info: { bytes: number; overLimit: boolean }) => void;
  disabled?: boolean;
  rows?: number;
  placeholder?: string;
  id?: string;
}

export function PostBodyEditor({
  title,
  content,
  onContentChange,
  createdAt,
  onSizeChange,
  disabled = false,
  rows = 8,
  placeholder = "Write your post… drop images anywhere to attach them inline.",
  id,
}: PostBodyEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);

  const now = createdAt ?? Date.now();
  const bytes = computePayloadBytes({
    title,
    content,
    createdAt: now,
    updatedAt: Date.now(),
  });
  const overLimit = bytes > MAX_PAYLOAD_BYTES;
  const ratio = Math.min(1, bytes / MAX_PAYLOAD_BYTES);
  const nearLimit = ratio >= 0.8 && !overLimit;

  useEffect(() => {
    onSizeChange?.({ bytes, overLimit });
  }, [bytes, overLimit, onSizeChange]);

  const insertSnippet = useCallback(
    (snippet: string) => {
      const textarea = textareaRef.current;
      const start = textarea?.selectionStart ?? content.length;
      const end = textarea?.selectionEnd ?? content.length;
      const { value, caret } = insertAtCaret(content, snippet, start, end);
      onContentChange(value);
      // Restore caret after React updates the DOM.
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(caret, caret);
        }
      });
    },
    [content, onContentChange],
  );

  const attachFiles = useCallback(
    async (files: FileList | File[]) => {
      const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) {
        setAttachError("Only image files can be attached.");
        return;
      }
      setAttachError(null);
      try {
        for (const file of images) {
          const dataUrl = await fileToDataUrl(file);
          const alt = file.name.replace(/\.[^.]+$/, "") || "image";
          // Inline markdown image surrounded by blank lines so it renders as
          // its own paragraph.
          const snippet = `\n\n![${alt}](${dataUrl})\n\n`;
          insertSnippet(snippet);
        }
      } catch (err) {
        console.error("Failed to attach image", err);
        setAttachError((err as Error).message ?? "Failed to attach image");
      }
    },
    [insertSnippet],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLTextAreaElement>) => {
      event.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        void attachFiles(files);
      }
    },
    [attachFiles, disabled],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLTextAreaElement>) => {
    if (event.dataTransfer?.types?.includes("Files")) {
      event.preventDefault();
      setDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      void attachFiles(files);
    }
    // Reset so selecting the same file twice still triggers `change`.
    event.target.value = "";
  };

  const meterClass = overLimit
    ? "size-meter over"
    : nearLimit
      ? "size-meter warn"
      : "size-meter";

  return (
    <div className="body-editor">
      <div className="body-editor-toolbar">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          📎 Attach image
        </button>
        <span className="body-editor-hint">
          Drop images into the editor or paste a link to a YouTube / X / GitHub
          page to embed a preview.
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFileInput}
        />
      </div>
      <textarea
        id={id}
        ref={textareaRef}
        value={content}
        onChange={(event) => onContentChange(event.target.value)}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        placeholder={placeholder}
        rows={rows}
        required
        disabled={disabled}
        className={dragOver ? "drag-over" : undefined}
      />
      {attachError && <div className="error-banner">{attachError}</div>}
      <div className={meterClass} role="status" aria-live="polite">
        <div className="size-meter-bar">
          <div
            className="size-meter-fill"
            style={{ width: `${Math.min(100, ratio * 100)}%` }}
          />
        </div>
        <small>
          Payload size: <strong>{formatBytes(bytes)}</strong> /{" "}
          {formatBytes(MAX_PAYLOAD_BYTES)}
          {overLimit && (
            <>
              {" "}
              — <strong>over the {formatBytes(MAX_PAYLOAD_BYTES)} limit</strong>,
              please remove an image or shorten the content before publishing.
            </>
          )}
          {nearLimit && <> — getting close to the limit.</>}
        </small>
      </div>
    </div>
  );
}
