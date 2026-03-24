import type { Route } from './+types/csv-to-json-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { csvToJson } from '@/features/convert/converters';
import { ToolPageContent } from '@/components/ToolPageContent';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'CSV to JSON Converter — Free, No Upload, Private',
    description:
      'Convert CSV to JSON privately in your browser — no data uploaded. Auto-detects headers and delimiter. Free, no account required, 100% client-side.',
    path: '/csv-to-json-converter',
  });
}

export default function CsvToJsonConverter() {
  return (
    <ConverterLayout
      title="CSV → JSON Converter"
      fromLanguage="csv"
      toLanguage="json"
      fromPlaceholder={'name,age\nAlice,30\nBob,25'}
      convert={csvToJson}
    >
      <ToolPageContent
        toolName="CSV to JSON converter"
        why={
          <p className="text-fg-secondary">
            CSV files often contain personal data — customer records, order exports, HR data.
            formatvault converts your CSV to JSON entirely in your browser using PapaParse. No data
            is uploaded or transmitted to any server.
          </p>
        }
        howItWorks={
          <p className="text-fg-secondary">
            PapaParse auto-detects the delimiter (comma, tab, pipe, or semicolon) and parses each
            row. If the first row contains headers, they become the keys of each JSON object.
            Without headers, each row becomes an array. The output is a JSON array of objects or
            arrays.
          </p>
        }
        useCases={[
          'Converting spreadsheet exports to JSON for use in JavaScript applications',
          'Transforming CSV database exports to JSON for API ingestion',
          'Converting customer or order CSV exports for import into a NoSQL database',
          'Parsing CSV reports from analytics tools into JSON for further processing',
        ]}
        faq={[
          {
            q: 'Is my data safe to convert here?',
            a: 'Yes. PapaParse runs entirely in your browser. No data is transmitted to any server.',
          },
          {
            q: 'What delimiters are supported?',
            a: 'PapaParse auto-detects comma, tab, pipe, and semicolon delimiters.',
          },
          {
            q: 'What happens if my CSV has inconsistent column counts?',
            a: 'PapaParse reports rows with mismatched column counts. Missing values are output as empty strings or null depending on the row.',
          },
        ]}
      />
    </ConverterLayout>
  );
}
