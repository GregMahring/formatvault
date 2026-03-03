import { useState, useEffect, useCallback, useMemo } from 'react';
import ReactCodeMirror, { type Extension } from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

export type EditorLanguage = 'json' | 'yaml' | 'csv' | 'toml' | 'text' | 'typescript';

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: EditorLanguage;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  /** aria-label for the editor region */
  label: string;
  minHeight?: string;
  maxHeight?: string;
}

/** Load language extension on demand — Vite will code-split these imports. */
async function loadLangExtension(language: EditorLanguage): Promise<Extension | null> {
  if (language === 'json') {
    const { json } = await import('@codemirror/lang-json');
    return json();
  }
  if (language === 'yaml') {
    const { yaml } = await import('@codemirror/lang-yaml');
    return yaml();
  }
  if (language === 'typescript') {
    const { javascript } = await import('@codemirror/lang-javascript');
    return javascript({ typescript: true });
  }
  // csv / text — no language pack needed
  return null;
}

/**
 * CodeMirror 6 editor with:
 * - Lazy language pack loading (JSON/YAML loaded only on the routes that need them)
 * - Dark theme matching the app's dark-first design
 * - Font size synced to settingsStore
 * - Read-only mode for output panes
 */
export function CodeEditor({
  value,
  onChange,
  language = 'text',
  readOnly = false,
  placeholder,
  className,
  label,
  minHeight = '200px',
  maxHeight,
}: CodeEditorProps) {
  const { editorFontSize } = useSettingsStore();
  const [langExtension, setLangExtension] = useState<Extension | null>(null);

  // Load language pack once when language prop changes
  useEffect(() => {
    let cancelled = false;
    void loadLangExtension(language).then((ext) => {
      if (!cancelled) setLangExtension(ext);
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const extensions = useMemo<Extension[]>(() => {
    const exts: Extension[] = [
      EditorView.theme({
        '&': {
          fontFamily: 'var(--font-mono)',
          fontSize: `${String(editorFontSize)}px`,
        },
        '.cm-content': { padding: '8px 0' },
        '.cm-focused': { outline: 'none' },
      }),
    ];
    if (readOnly) exts.push(EditorView.editable.of(false));
    if (langExtension) exts.push(langExtension);
    return exts;
  }, [editorFontSize, readOnly, langExtension]);

  const handleChange = useCallback(
    (val: string) => {
      if (onChange) onChange(val);
    },
    [onChange]
  );

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md border border-gray-800 bg-gray-950',
        className
      )}
      role="group"
      aria-label={label}
    >
      <ReactCodeMirror
        value={value}
        onChange={readOnly ? undefined : handleChange}
        theme={oneDark}
        extensions={extensions}
        placeholder={placeholder}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: !readOnly,
          autocompletion: !readOnly,
          bracketMatching: true,
          closeBrackets: !readOnly,
          indentOnInput: !readOnly,
        }}
        style={{
          minHeight,
          ...(maxHeight ? { maxHeight, overflow: 'auto' } : {}),
        }}
      />
    </div>
  );
}
