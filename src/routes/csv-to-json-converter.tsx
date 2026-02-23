import type { Route } from './+types/csv-to-json-converter';
import { ToolPlaceholder } from '@/components/ToolPlaceholder';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'CSV to JSON Converter — formatvault' },
    {
      name: 'description',
      content:
        'Convert CSV to JSON online for free. Supports headers, custom delimiters and streaming for large files. 100% client-side.',
    },
  ];
}

export default function CsvToJsonConverter() {
  return (
    <ToolPlaceholder
      title="CSV → JSON Converter"
      description="Convert CSV data to JSON format"
      inputLabel="CSV Input"
      outputLabel="JSON Output"
    />
  );
}
