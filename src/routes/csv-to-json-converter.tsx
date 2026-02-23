import type { Route } from './+types/csv-to-json-converter';
import { ConverterLayout } from '@/components/ConverterLayout';
import { csvToJson } from '@/features/convert/converters';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'CSV to JSON Converter — formatvault' },
    {
      name: 'description',
      content:
        'Convert CSV to JSON online for free. Uses the first row as headers. Supports comma, tab, pipe and semicolon delimiters. 100% client-side.',
    },
    { property: 'og:title', content: 'CSV to JSON Converter — formatvault' },
    {
      property: 'og:description',
      content: 'Convert CSV to JSON online. Auto-detects delimiters. No data leaves your browser.',
    },
  ];
}

export default function CsvToJsonConverter() {
  return (
    <ConverterLayout
      title="CSV → JSON Converter"
      fromLanguage="csv"
      toLanguage="json"
      fromPlaceholder={'name,age\nAlice,30\nBob,25'}
      convert={csvToJson}
    />
  );
}
