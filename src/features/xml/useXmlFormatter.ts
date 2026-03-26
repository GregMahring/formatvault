import { useState, useCallback } from 'react';
import {
  formatXml,
  minifyXml,
  validateXmlOnly,
  type XmlIndent,
  type XmlFormatError,
} from './xmlFormatter';

export type XmlMode = 'format' | 'minify' | 'validate';

export interface XmlFormatterState {
  input: string;
  output: string;
  error: XmlFormatError | null;
  mode: XmlMode;
  indent: XmlIndent;
}

export interface XmlFormatterActions {
  setInput: (v: string) => void;
  setMode: (m: XmlMode) => void;
  setIndent: (i: XmlIndent) => void;
  process: () => void;
  clear: () => void;
}

export function useXmlFormatter(): XmlFormatterState & XmlFormatterActions {
  const [input, setInputRaw] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<XmlFormatError | null>(null);
  const [mode, setMode] = useState<XmlMode>('format');
  const [indent, setIndent] = useState<XmlIndent>(2);

  const process = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (mode === 'validate') {
      const err = validateXmlOnly(input);
      setError(err);
      setOutput('');
      return;
    }

    const result = mode === 'minify' ? minifyXml(input) : formatXml(input, indent);
    if (result.error !== null) {
      setError(result);
      setOutput('');
    } else {
      setError(null);
      setOutput(result.output);
    }
  }, [input, mode, indent]);

  const setInput = useCallback((v: string) => {
    setInputRaw(v);
    setError(null);
  }, []);

  const clear = useCallback(() => {
    setInputRaw('');
    setOutput('');
    setError(null);
  }, []);

  return { input, output, error, mode, indent, setInput, setMode, setIndent, process, clear };
}
