import { useState, useCallback } from 'react';
import type { Route } from './+types/yaml-to-csv-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { yamlToCsv, type CsvOutputDelimiter } from '@/features/convert/converters';
import { ToolPageContent } from '@/components/ToolPageContent';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'YAML to CSV Converter — Free, No Upload, Private',
    description:
      'Convert YAML to CSV privately in your browser — no data uploaded. Supports arrays of objects. Free, no account required, 100% client-side.',
    path: '/yaml-to-csv-converter',
    faqItems: [
      {
        q: 'Is my data safe to convert here?',
        a: 'Yes. All conversion happens in your browser. No data is transmitted to any server.',
      },
      {
        q: 'What YAML input format is required?',
        a: 'The YAML must be a sequence (array) of mappings (objects). Each mapping becomes a CSV row.',
      },
    ],
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
        toolName="YAML to CSV converter"
        why={
          <p className="text-fg-secondary">
            Converting YAML data to tabular CSV format for spreadsheets or reporting is a common
            need. This converter handles it entirely in your browser using js-yaml and PapaParse —
            no data is uploaded or transmitted.
          </p>
        }
        howItWorks={
          <p className="text-fg-secondary">
            js-yaml parses the YAML input. The converter expects a YAML sequence (array) of mappings
            (objects). It extracts all unique keys as CSV column headers, then maps each object to a
            CSV row, filling missing keys with empty cells.
          </p>
        }
        useCases={[
          'Converting YAML data files to CSV for import into Excel or Google Sheets',
          'Exporting YAML configuration records to CSV for reporting',
          'Transforming structured YAML lists to tabular data for analysis',
        ]}
        faq={[
          {
            q: 'Is my data safe to convert here?',
            a: 'Yes. All conversion happens in your browser. No data is transmitted to any server.',
          },
          {
            q: 'What YAML input format is required?',
            a: 'The YAML must be a sequence (array) of mappings (objects). Each mapping becomes a CSV row.',
          },
        ]}
      />
    </ConverterLayout>
  );
}
