import { useState, useCallback } from 'react';
import type { Route } from './+types/json-to-csv-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { jsonToCsv, type CsvOutputDelimiter } from '@/features/convert/converters';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JSON to CSV Converter',
    description:
      'Convert JSON to CSV online for free. Handles nested objects with flattening. 100% client-side.',
    path: '/json-to-csv-converter',
  });
}

export default function JsonToCsvConverter() {
  const [delimiter, setDelimiter] = useState<CsvOutputDelimiter>(',');

  const convert = useCallback((input: string) => jsonToCsv(input, delimiter), [delimiter]);

  return (
    <ConverterLayout
      title="JSON → CSV Converter"
      fromLanguage="json"
      toLanguage="csv"
      fromPlaceholder='[{"name":"Alice","age":30},{"name":"Bob","age":25}]'
      convert={convert}
      toolbarSlot={
        <>
          <label htmlFor="csv-delimiter-select" className="text-xs text-gray-400">
            Delimiter
          </label>
          <select
            id="csv-delimiter-select"
            value={delimiter}
            onChange={(e) => {
              setDelimiter(e.target.value as CsvOutputDelimiter);
            }}
            className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-200 focus:border-accent-500 focus:outline-none"
          >
            <option value=",">Comma (,)</option>
            <option value={'\t'}>Tab</option>
            <option value="|">Pipe (|)</option>
            <option value=";">Semicolon (;)</option>
          </select>
        </>
      }
    />
  );
}
