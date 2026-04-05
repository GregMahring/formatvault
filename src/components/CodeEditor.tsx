import { useState, useEffect, useCallback, useMemo } from 'react';
import ReactCodeMirror, { type Extension } from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { formatvaultDark, formatvaultLight } from '@/lib/editorTheme';

export type EditorLanguage =
  | 'json'
  | 'yaml'
  | 'csv'
  | 'toml'
  | 'sql'
  | 'xml'
  | 'text'
  | 'typescript';

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: EditorLanguage;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  /** aria-label for the editor region */
  label: string;
  height?: string;
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
  if (language === 'toml') {
    const [{ toml }, { StreamLanguage }] = await Promise.all([
      import('@codemirror/legacy-modes/mode/toml'),
      import('@codemirror/language'),
    ]);
    return StreamLanguage.define(toml);
  }
  if (language === 'sql') {
    const { sql } = await import('@codemirror/lang-sql');
    return sql();
  }
  if (language === 'xml') {
    const { xml } = await import('@codemirror/lang-xml');
    return xml();
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
  height,
  minHeight,
  maxHeight,
}: CodeEditorProps) {
  const { editorFontSize, theme } = useSettingsStore();
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
      }),
      EditorView.contentAttributes.of({ 'aria-label': label }),
    ];
    if (readOnly) exts.push(EditorView.editable.of(false));
    if (langExtension) exts.push(langExtension);
    return exts;
  }, [editorFontSize, readOnly, langExtension, label]);

  const handleChange = useCallback(
    (val: string) => {
      if (onChange) onChange(val);
    },
    [onChange]
  );

  const editor = (
    <ReactCodeMirror
      value={value}
      onChange={readOnly ? undefined : handleChange}
      theme={theme === 'dark' ? formatvaultDark : formatvaultLight}
      extensions={extensions}
      placeholder={placeholder}
      readOnly={readOnly}
      height={height ?? undefined}
      minHeight={minHeight}
      maxHeight={maxHeight}
      // When filling a positioned container, the ReactCodeMirror wrapper div
      // also needs height: 100% so that .cm-editor { height: 100% } resolves
      // against a definite value rather than collapsing to auto.
      style={height !== undefined ? { height: '100%' } : undefined}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: !readOnly,
        autocompletion: !readOnly,
        bracketMatching: true,
        closeBrackets: !readOnly,
        indentOnInput: !readOnly,
      }}
    />
  );

  return (
    <div
      className={cn('relative rounded-md border border-edge bg-surface-raised', className)}
      role="group"
      aria-label={label}
    >
      {height !== undefined ? (
        // absolute inset-0 gives the positioned parent's flex-1 height as a
        // definite anchor. % heights inside resolve correctly without depending
        // on the flex percentage-height chain, which browsers handle inconsistently.
        <div className="absolute inset-0">{editor}</div>
      ) : (
        editor
      )}
    </div>
  );
}
