import { useState, useEffect, useCallback } from 'react';
import { usePreloadedInput } from '@/hooks/usePreloadedInput';
import {
  encodeBase64,
  decodeBase64,
  looksLikeBase64,
  isBase64Error,
  type Base64Mode,
} from './base64Codec';

interface Base64EncoderState {
  input: string;
  mode: Base64Mode;
  urlSafe: boolean;
  output: string;
  error: string | null;
}

interface Base64EncoderActions {
  setInput: (v: string) => void;
  setMode: (m: Base64Mode) => void;
  setUrlSafe: (v: boolean) => void;
  clear: () => void;
  swap: () => void;
}

export function useBase64Encoder(): Base64EncoderState & Base64EncoderActions {
  const [input, setInputRaw] = useState('');
  const [mode, setMode] = useState<Base64Mode>('encode');
  const [urlSafe, setUrlSafe] = useState(false);

  const setInput = useCallback((v: string) => {
    setInputRaw(v);
  }, []);

  usePreloadedInput(setInput);

  // Auto-detect mode when input changes
  useEffect(() => {
    if (!input.trim()) return;
    setMode(looksLikeBase64(input) ? 'decode' : 'encode');
  }, [input]);

  const result = input.trim()
    ? mode === 'encode'
      ? encodeBase64(input, urlSafe)
      : decodeBase64(input)
    : null;

  const output = result && !isBase64Error(result) ? result.output : '';
  const error = result && isBase64Error(result) ? result.error : null;

  const clear = useCallback(() => {
    setInputRaw('');
  }, []);

  const swap = useCallback(() => {
    if (output) {
      setInputRaw(output);
      setMode((m) => (m === 'encode' ? 'decode' : 'encode'));
    }
  }, [output]);

  return {
    input,
    mode,
    urlSafe,
    output,
    error,
    setInput,
    setMode,
    setUrlSafe,
    clear,
    swap,
  };
}
