import { useState, useCallback } from 'react';
import type { Route } from './+types/yaml-to-csv-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { yamlToCsv, type CsvOutputDelimiter } from '@/features/convert/converters';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'YAML to CSV Converter',
    description:
      'Convert YAML to CSV online for free. Supports arrays of objects. 100% client-side.',
    path: '/yaml-to-csv-converter',
  });
}

export default function YamlToCsvConverter() {
  const [delimiter, setDelimiter] = useState<CsvOutputDelimiter>(',');

  const convert = useCallback((input: string) => yamlToCsv(input, delimiter), [delimiter]);

  return (
    <ConverterLayout
      title="YAML → CSV Converter"
      fromLanguage="yaml"
      toLanguage="csv"
      fromPlaceholder={'- name: Alice\n  age: 30\n- name: Bob\n  age: 25'}
      convert={convert}
      toolbarSlot={
        <>
          <label htmlFor="csv-delimiter-select" className="text-xs text-fg-secondary">
            Delimiter
          </label>
          <select
            id="csv-delimiter-select"
            value={delimiter}
            onChange={(e) => {
              setDelimiter(e.target.value as CsvOutputDelimiter);
            }}
            className="rounded border border-edge-emphasis bg-surface-raised px-2 py-1 text-xs text-gray-200 focus:border-accent-500 focus:outline-none"
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
