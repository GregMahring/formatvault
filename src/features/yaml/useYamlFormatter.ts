import { useState, useCallback } from 'react';
import {
  formatYaml,
  type YamlIndent,
  type YamlStyle,
  type YamlFormatError,
  type YamlResult,
} from './yamlFormatter';

function isYamlError(r: YamlResult): r is YamlFormatError {
  return r.error !== null;
}

export interface YamlFormatterState {
  input: string;
  output: string;
  error: YamlFormatError | null;
  indent: YamlIndent;
  style: YamlStyle;
  documentCount: number;
}

export interface YamlFormatterActions {
  setInput: (v: string) => void;
  setIndent: (i: YamlIndent) => void;
  setStyle: (s: YamlStyle) => void;
  process: () => void;
  clear: () => void;
}

export function useYamlFormatter(): YamlFormatterState & YamlFormatterActions {
  const [input, setInputRaw] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<YamlFormatError | null>(null);
  const [indent, setIndent] = useState<YamlIndent>(2);
  const [style, setStyle] = useState<YamlStyle>('block');
  const [documentCount, setDocumentCount] = useState(0);

  const process = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      setDocumentCount(0);
      return;
    }

    const result = formatYaml(input, { indent, style });
    if (isYamlError(result)) {
      setError(result);
      setOutput('');
    } else {
      setError(null);
      setOutput(result.output);
      setDocumentCount(result.documentCount);
    }
  }, [input, indent, style]);

  const setInput = useCallback((v: string) => {
    setInputRaw(v);
    setError(null);
  }, []);

  const clear = useCallback(() => {
    setInputRaw('');
    setOutput('');
    setError(null);
    setDocumentCount(0);
  }, []);

  return {
    input,
    output,
    error,
    indent,
    style,
    documentCount,
    setInput,
    setIndent,
    setStyle,
    process,
    clear,
  };
}
