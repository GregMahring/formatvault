import { useState, useCallback } from 'react';
import { parseColor, isColorError, type ParsedColor } from './colorConverter';

interface ColorPickerState {
  textInput: string;
  color: ParsedColor | null;
  inputError: string | null;
  pickerHex: string;
}

interface ColorPickerActions {
  applyText: (raw: string) => void;
  onPickerChange: (hex: string) => void;
  clear: () => void;
}

export function useColorPicker(): ColorPickerState & ColorPickerActions {
  const [textInput, setTextInput] = useState('');
  const [color, setColor] = useState<ParsedColor | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const pickerHex = color?.hex ?? '#3b82f6';

  const applyText = useCallback((raw: string) => {
    setTextInput(raw);
    if (!raw.trim()) {
      setColor(null);
      setInputError(null);
      return;
    }
    const result = parseColor(raw);
    if (isColorError(result)) {
      setInputError(result.error);
    } else {
      setColor(result);
      setInputError(null);
    }
  }, []);

  const onPickerChange = useCallback(
    (hex: string) => {
      applyText(hex);
    },
    [applyText]
  );

  const clear = useCallback(() => {
    setTextInput('');
    setColor(null);
    setInputError(null);
  }, []);

  return {
    textInput,
    color,
    inputError,
    pickerHex,
    applyText,
    onPickerChange,
    clear,
  };
}
