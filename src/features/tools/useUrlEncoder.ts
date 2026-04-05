import { useState, useEffect, useCallback } from 'react';
import { usePreloadedInput } from '@/hooks/usePreloadedInput';
import {
  encodeUrl,
  decodeUrl,
  looksLikeEncoded,
  parseQueryString,
  isUrlError,
  type UrlMode,
  type UrlEncodeVariant,
} from './urlCodec';

interface UrlEncoderState {
  input: string;
  mode: UrlMode;
  variant: UrlEncodeVariant;
  showParsed: boolean;
  output: string;
  error: string | null;
  looksLikeQuery: boolean;
  parsedParams: { key: string; value: string }[] | null;
  inputParams: { key: string; value: string }[] | null;
}

interface UrlEncoderActions {
  setInput: (v: string) => void;
  setMode: (m: UrlMode) => void;
  setVariant: (v: UrlEncodeVariant) => void;
  setShowParsed: (v: boolean) => void;
  clear: () => void;
  swap: () => void;
}

export function useUrlEncoder(): UrlEncoderState & UrlEncoderActions {
  const [input, setInputRaw] = useState('');
  const [mode, setMode] = useState<UrlMode>('encode');
  const [variant, setVariant] = useState<UrlEncodeVariant>('component');
  const [showParsed, setShowParsed] = useState(false);

  const setInput = useCallback((v: string) => {
    setInputRaw(v);
  }, []);

  usePreloadedInput(setInput);

  // Auto-detect mode from input
  useEffect(() => {
    if (!input.trim()) return;
    setMode(looksLikeEncoded(input) ? 'decode' : 'encode');
  }, [input]);

  const result = input.trim()
    ? mode === 'encode'
      ? encodeUrl(input, variant)
      : decodeUrl(input)
    : null;

  const output = result && !isUrlError(result) ? result.output : '';
  const error = result && isUrlError(result) ? result.error : null;

  const looksLikeQuery = /[?&=]/.test(input);
  const parsedParams = showParsed && output ? parseQueryString(output) : null;
  const inputParams = showParsed && input ? parseQueryString(input) : null;

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
    variant,
    showParsed,
    output,
    error,
    looksLikeQuery,
    parsedParams,
    inputParams,
    setInput,
    setMode,
    setVariant,
    setShowParsed,
    clear,
    swap,
  };
}
