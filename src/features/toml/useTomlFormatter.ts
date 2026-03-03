import { useState, useCallback } from 'react';
import { formatToml, type TomlFormatError, type TomlResult } from './tomlFormatter';

function isTomlError(r: TomlResult): r is TomlFormatError {
  return r.error !== null;
}

export interface TomlFormatterState {
  input: string;
  output: string;
  error: TomlFormatError | null;
}

export interface TomlFormatterActions {
  setInput: (v: string) => void;
  process: () => void;
  clear: () => void;
}

export function useTomlFormatter(): TomlFormatterState & TomlFormatterActions {
  const [input, setInputRaw] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<TomlFormatError | null>(null);

  const process = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const result = formatToml(input);
    if (isTomlError(result)) {
      setError(result);
      setOutput('');
    } else {
      setError(null);
      setOutput(result.output);
    }
  }, [input]);

  const setInput = useCallback((v: string) => {
    setInputRaw(v);
    setError(null);
  }, []);

  const clear = useCallback(() => {
    setInputRaw('');
    setOutput('');
    setError(null);
  }, []);

  return { input, output, error, setInput, process, clear };
}
