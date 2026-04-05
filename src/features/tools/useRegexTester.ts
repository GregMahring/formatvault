import { useState, useCallback, useMemo } from 'react';
import { usePreloadedInput } from '@/hooks/usePreloadedInput';
import { testRegex, DEFAULT_FLAGS, type RegexFlags, type RegexResult } from './regexTester';

interface RegexTesterState {
  pattern: string;
  flags: RegexFlags;
  input: string;
  result: RegexResult;
  copyContent: string;
  matchCount: number;
  hasPattern: boolean;
  hasInput: boolean;
}

interface RegexTesterActions {
  setPattern: (v: string) => void;
  setInput: (v: string) => void;
  toggleFlag: (key: keyof RegexFlags) => void;
  clear: () => void;
}

export function useRegexTester(): RegexTesterState & RegexTesterActions {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<RegexFlags>(DEFAULT_FLAGS);
  const [input, setInputRaw] = useState('');

  const setInput = useCallback((v: string) => {
    setInputRaw(v);
  }, []);

  usePreloadedInput(setInput);

  const result = useMemo(() => testRegex(pattern, flags, input), [pattern, flags, input]);

  const copyContent = useMemo(() => {
    if (!result.matches || result.matches.length === 0) return '';
    return result.matches
      .map((m, i) => `Match ${String(i + 1)}: "${m.value}" at ${String(m.index)}–${String(m.end)}`)
      .join('\n');
  }, [result]);

  const matchCount = result.matches?.length ?? 0;
  const hasPattern = pattern.length > 0;
  const hasInput = input.length > 0;

  const toggleFlag = useCallback((key: keyof RegexFlags) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const clear = useCallback(() => {
    setPattern('');
    setInputRaw('');
  }, []);

  return {
    pattern,
    flags,
    input,
    result,
    copyContent,
    matchCount,
    hasPattern,
    hasInput,
    setPattern,
    setInput,
    toggleFlag,
    clear,
  };
}
