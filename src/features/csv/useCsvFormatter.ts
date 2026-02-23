import { useState, useCallback } from 'react';
import { formatCsv, type Delimiter, type CsvResult, type CsvFormatError } from './csvFormatter';

function isCsvError(r: CsvResult): r is CsvFormatError {
  return r.error !== null;
}

export interface CsvFormatterState {
  input: string;
  output: string;
  error: string | null;
  delimiter: Delimiter;
  hasHeader: boolean;
  rowCount: number;
  columnCount: number;
  detectedDelimiter: string;
  warning: string | null;
}

export interface CsvFormatterActions {
  setInput: (v: string) => void;
  setDelimiter: (d: Delimiter) => void;
  setHasHeader: (v: boolean) => void;
  process: () => void;
  clear: () => void;
}

export function useCsvFormatter(): CsvFormatterState & CsvFormatterActions {
  const [input, setInputRaw] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [delimiter, setDelimiter] = useState<Delimiter>('auto');
  const [hasHeader, setHasHeader] = useState(true);
  const [rowCount, setRowCount] = useState(0);
  const [columnCount, setColumnCount] = useState(0);
  const [detectedDelimiter, setDetectedDelimiter] = useState('');
  const [warning, setWarning] = useState<string | null>(null);

  const process = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      setWarning(null);
      return;
    }

    const result = formatCsv(input, { delimiter, hasHeader });
    if (isCsvError(result)) {
      setError(result.error);
      setOutput('');
      setRowCount(result.rowCount ?? 0);
      setWarning(null);
    } else {
      setError(null);
      setOutput(result.output);
      setRowCount(result.rowCount);
      setColumnCount(result.columnCount);
      setDetectedDelimiter(result.detectedDelimiter ?? ',');
      // Check for warning comment in output (added by formatCsv on inconsistent rows)
      if (result.output.startsWith('# Warning:')) {
        setWarning('Some rows have an inconsistent number of columns.');
      } else {
        setWarning(null);
      }
    }
  }, [input, delimiter, hasHeader]);

  const setInput = useCallback((v: string) => {
    setInputRaw(v);
    setError(null);
  }, []);

  const clear = useCallback(() => {
    setInputRaw('');
    setOutput('');
    setError(null);
    setWarning(null);
    setRowCount(0);
    setColumnCount(0);
    setDetectedDelimiter('');
  }, []);

  return {
    input,
    output,
    error,
    delimiter,
    hasHeader,
    rowCount,
    columnCount,
    detectedDelimiter,
    warning,
    setInput,
    setDelimiter,
    setHasHeader,
    process,
    clear,
  };
}
