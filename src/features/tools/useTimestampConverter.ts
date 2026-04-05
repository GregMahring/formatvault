import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  parseTimestamp,
  dateStringToTimestamps,
  nowSeconds,
  toDatetimeLocalValue,
  isTimestampError,
  detectUnit,
  type TimestampUnit,
  type TimestampBreakdown,
  type TimestampResult,
} from './timestampConverter';

interface TimestampConverterState {
  input: string;
  forceUnit: TimestampUnit | undefined;
  reverseInput: string;
  result: TimestampResult | null;
  breakdown: TimestampBreakdown | null;
  error: string | null;
  effectiveUnit: TimestampUnit;
  reverseResult: { seconds: number; milliseconds: number } | null;
}

interface TimestampConverterActions {
  setTimestampInput: (v: string) => void;
  setForceUnit: (u: TimestampUnit) => void;
  setReverseInput: (v: string) => void;
  handleNow: () => void;
  clear: () => void;
}

export function useTimestampConverter(): TimestampConverterState & TimestampConverterActions {
  const [input, setInput] = useState('');
  const [forceUnit, setForceUnit] = useState<TimestampUnit | undefined>(undefined);
  const [reverseInput, setReverseInput] = useState('');

  const result = useMemo(
    () => (input.trim() ? parseTimestamp(input, forceUnit) : null),
    [input, forceUnit]
  );

  const breakdown: TimestampBreakdown | null =
    result && !isTimestampError(result) ? result.breakdown : null;
  const error = result && isTimestampError(result) ? result.error : null;

  const effectiveUnit: TimestampUnit =
    result && !isTimestampError(result)
      ? result.detectedUnit
      : (forceUnit ?? (input.trim() ? detectUnit(Number(input.trim())) : 'seconds'));

  const reverseResult = useMemo(() => dateStringToTimestamps(reverseInput), [reverseInput]);

  // Keep reverse input in sync when a valid breakdown exists
  useEffect(() => {
    if (breakdown) {
      setReverseInput(toDatetimeLocalValue(new Date(breakdown.milliseconds)));
    }
  }, [breakdown]);

  const setTimestampInput = useCallback((v: string) => {
    setInput(v);
    setForceUnit(undefined);
  }, []);

  const handleNow = useCallback(() => {
    setInput(nowSeconds());
    setForceUnit(undefined);
  }, []);

  const clear = useCallback(() => {
    setInput('');
    setForceUnit(undefined);
    setReverseInput('');
  }, []);

  return {
    input,
    forceUnit,
    reverseInput,
    result,
    breakdown,
    error,
    effectiveUnit,
    reverseResult,
    setTimestampInput,
    setForceUnit,
    setReverseInput,
    handleNow,
    clear,
  };
}
