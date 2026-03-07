import { useRef, useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileUploadZoneProps {
  /** Accepted MIME types and extensions e.g. ".json,application/json" */
  accept?: string;
  onFile: (file: File) => void;
  /** Max file size in bytes (default 500 MB) */
  maxSize?: number;
  className?: string;
  disabled?: boolean;
}

const DEFAULT_MAX = 500 * 1024 * 1024;

/**
 * Drag-and-drop + click-to-upload zone.
 * Renders as a dashed overlay that activates when a file is dragged over the parent.
 */
export function FileUploadZone({
  accept,
  onFile,
  maxSize = DEFAULT_MAX,
  className,
  disabled = false,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setSizeError(null);
      if (file.size > maxSize) {
        setSizeError(
          `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max: ${(maxSize / 1024 / 1024).toFixed(0)} MB`
        );
        return;
      }
      onFile(file);
    },
    [maxSize, onFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so the same file can be re-uploaded
      e.target.value = '';
    },
    [handleFile]
  );

  const openFilePicker = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  return (
    <div
      className={cn('relative', className)}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        aria-label="Upload file"
        onChange={handleInputChange}
        tabIndex={-1}
      />

      {/* Drag overlay — visible when dragging */}
      {isDragOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-accent-500 bg-gray-950/90 backdrop-blur-sm">
          <Upload className="h-8 w-8 text-accent-400" aria-hidden="true" />
          <span className="text-sm font-medium text-accent-300">Drop file to upload</span>
        </div>
      )}

      {/* Size error toast */}
      {sizeError && (
        <div
          role="alert"
          className="absolute inset-x-0 top-2 z-30 mx-4 rounded-md border border-red-800 bg-red-950/90 px-3 py-2 text-xs text-red-300 shadow-lg"
        >
          {sizeError}
          <button
            type="button"
            className="ml-2 text-red-500 hover:text-red-300"
            onClick={() => {
              setSizeError(null);
            }}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload button — shown as a compact icon button in the pane header */}
      <button
        type="button"
        onClick={openFilePicker}
        disabled={disabled}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-300 disabled:opacity-40"
        aria-label="Upload file"
        title="Upload file"
      >
        <Upload className="h-3 w-3" aria-hidden="true" />
        Upload
      </button>
    </div>
  );
}
