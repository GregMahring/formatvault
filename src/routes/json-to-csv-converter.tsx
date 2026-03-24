import { useState, useCallback } from 'react';
import type { Route } from './+types/json-to-csv-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { ToolPageContent } from '@/components/ToolPageContent';
import { jsonToCsv, type CsvOutputDelimiter } from '@/features/convert/converters';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JSON to CSV Converter — Free, No Upload, Private',
    description:
      'Convert JSON to CSV privately in your browser — no data uploaded. Handles nested objects with automatic flattening. Free, no account required, 100% client-side.',
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
          <label htmlFor="csv-delimiter-select" className="text-xs text-fg-secondary">
            Delimiter
          </label>
          <select
            id="csv-delimiter-select"
            value={delimiter}
            onChange={(e) => {
              setDelimiter(e.target.value as CsvOutputDelimiter);
            }}
            className="rounded border border-edge-emphasis bg-surface-raised px-2 py-1 text-xs text-fg focus:border-accent-500 focus:outline-none"
          >
            <option value=",">Comma (,)</option>
            <option value={'\t'}>Tab</option>
            <option value="|">Pipe (|)</option>
            <option value=";">Semicolon (;)</option>
          </select>
        </>
      }
    >
      <ToolPageContent
        toolName="JSON to CSV converter"
        why={
          <p className="text-fg-secondary">
            Converting JSON to CSV often involves pasting sensitive API payloads or database records
            into an online tool. formatvault converts your data entirely in your browser — no data
            is uploaded, logged, or transmitted to any server.
          </p>
        }
        howItWorks={
          <p className="text-fg-secondary">
            The converter flattens the JSON array of objects into tabular form. Nested objects are
            dot-notation flattened (e.g.{' '}
            <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-brand-cyan bg-[#00d4e8]/8">
              address.city
            </code>
            ) so every value fits a CSV column. You can choose the output delimiter: comma, tab,
            pipe, or semicolon.
          </p>
        }
        useCases={[
          'Exporting API response data to CSV for import into Excel or Google Sheets',
          'Converting database query results (JSON) to CSV for reporting tools',
          'Preparing data for upload to Salesforce, HubSpot, or other CRMs',
          'Flattening nested API payloads for analysis in pandas or R',
          'Converting JSON logs to CSV for filtering in spreadsheet software',
        ]}
        faq={[
          {
            q: 'What JSON input format is required?',
            a: 'The input must be a JSON array of objects. All objects should share the same keys, though missing keys in some rows are allowed and output as empty cells.',
          },
          {
            q: 'How are nested objects handled?',
            a: 'Nested objects are flattened using dot notation. For example, {"address": {"city": "London"}} becomes a column named address.city.',
          },
          {
            q: 'Is my data safe to convert here?',
            a: 'Yes. All conversion happens in your browser. No data is transmitted to any server.',
          },
        ]}
      />
    </ConverterLayout>
  );
}
