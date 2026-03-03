import { useState, useEffect, useCallback, useRef } from 'react';
import {
  computeHash,
  DEFAULT_ALGORITHM,
  type HashAlgorithm,
  type HashOutput,
} from './hashGenerator';

interface HashGeneratorState {
  input: string;
  algorithm: HashAlgorithm;
  result: HashOutput | null;
  isHashing: boolean;
  inputMode: 'text' | 'file';
  fileName: string | null;
}

interface HashGeneratorActions {
  setInput: (v: string) => void;
  setAlgorithm: (v: HashAlgorithm) => void;
  setInputMode: (v: 'text' | 'file') => void;
  hashFile: (file: File) => Promise<void>;
  clear: () => void;
}

export function useHashGenerator(): HashGeneratorState & HashGeneratorActions {
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>(DEFAULT_ALGORITHM);
  const [result, setResult] = useState<HashOutput | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [fileName, setFileName] = useState<string | null>(null);

  // Debounce ref for text hashing
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-hash in text mode whenever input or algorithm changes, with 100ms debounce
  useEffect(() => {
    if (inputMode !== 'text') return;

    if (!input) {
      setResult(null);
      return;
    }

    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setIsHashing(true);
      void computeHash(input, algorithm).then((r) => {
        setResult(r);
        setIsHashing(false);
      });
    }, 100);

    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [input, algorithm, inputMode]);

  const hashFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setIsHashing(true);
      try {
        const buf = await file.arrayBuffer();
        const r = await computeHash(buf, algorithm);
        setResult(r);
      } finally {
        setIsHashing(false);
      }
    },
    [algorithm]
  );

  // When algorithm changes in file mode, re-hash the current file if we have a result
  // by re-triggering file hash — we can't re-read the file, so instead just clear
  // and prompt re-upload if needed. Actually, simplest: re-hash is only meaningful
  // if the user changes algo after uploading. We handle this by exposing algorithm
  // changes and letting hashFile be re-called from the UI. For now, clear the result
  // when algorithm changes in file mode so output stays consistent.
  useEffect(() => {
    if (inputMode === 'file') {
      setResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algorithm]);

  const handleSetInputMode = useCallback((v: 'text' | 'file') => {
    setInputMode(v);
    setResult(null);
    setFileName(null);
  }, []);

  const clear = useCallback(() => {
    setInput('');
    setResult(null);
    setFileName(null);
    setIsHashing(false);
  }, []);

  return {
    input,
    algorithm,
    result,
    isHashing,
    inputMode,
    fileName,
    setInput,
    setAlgorithm,
    setInputMode: handleSetInputMode,
    hashFile,
    clear,
  };
}
