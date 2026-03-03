import { useState, useCallback } from 'react';
import {
  generateJsonSchema,
  validateJsonAgainstSchema,
  type SchemaGenResult,
  type SchemaValidateResult,
  type ValidationResult,
} from './jsonSchema';

export type SchemaMode = 'generate' | 'validate';

export interface UseJsonSchemaReturn {
  mode: SchemaMode;
  jsonInput: string;
  schemaOutput: string;
  schemaInput: string;
  validationResult: ValidationResult | null;
  error: string | null;
  isProcessing: boolean;

  setMode: (mode: SchemaMode) => void;
  setJsonInput: (v: string) => void;
  setSchemaInput: (v: string) => void;
  generate: () => Promise<void>;
  validate: () => Promise<void>;
  clear: () => void;
  useGeneratedSchema: () => void;
}

export function useJsonSchema(): UseJsonSchemaReturn {
  const [mode, setMode] = useState<SchemaMode>('generate');
  const [jsonInput, setJsonInputRaw] = useState('');
  const [schemaOutput, setSchemaOutput] = useState('');
  const [schemaInput, setSchemaInput] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const setJsonInput = useCallback((v: string) => {
    setJsonInputRaw(v);
    setError(null);
    setValidationResult(null);
  }, []);

  const generate = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const result: SchemaGenResult = await generateJsonSchema(jsonInput);
      if (result.error !== null) {
        setError(result.error);
        setSchemaOutput('');
      } else {
        setSchemaOutput(result.output);
        setError(null);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [jsonInput]);

  const validate = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    setValidationResult(null);
    try {
      const result: SchemaValidateResult = await validateJsonAgainstSchema(jsonInput, schemaInput);
      if (result.error !== null) {
        setError(result.error);
      } else {
        setValidationResult(result.result);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [jsonInput, schemaInput]);

  const clear = useCallback(() => {
    setJsonInputRaw('');
    setSchemaOutput('');
    setSchemaInput('');
    setValidationResult(null);
    setError(null);
  }, []);

  /** Copy generated schema into the validation schema input. */
  const useGeneratedSchema = useCallback(() => {
    if (schemaOutput) {
      setSchemaInput(schemaOutput);
    }
  }, [schemaOutput]);

  return {
    mode,
    jsonInput,
    schemaOutput,
    schemaInput,
    validationResult,
    error,
    isProcessing,
    setMode,
    setJsonInput,
    setSchemaInput,
    generate,
    validate,
    clear,
    useGeneratedSchema,
  };
}
