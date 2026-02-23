import type { Route } from './+types/json-to-csv-converter';
import { ConverterLayout } from '@/components/ConverterLayout';
import { jsonToCsv } from '@/features/convert/converters';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'JSON to CSV Converter — formatvault' },
    {
      name: 'description',
      content:
        'Convert JSON to CSV online for free. Handles arrays of objects, warns on nested values. 100% client-side — no data leaves your browser.',
    },
    { property: 'og:title', content: 'JSON to CSV Converter — formatvault' },
    {
      property: 'og:description',
      content: 'Convert JSON arrays to CSV online. Fast, free, 100% in your browser.',
    },
  ];
}

export default function JsonToCsvConverter() {
  return (
    <ConverterLayout
      title="JSON → CSV Converter"
      fromLanguage="json"
      toLanguage="csv"
      fromPlaceholder='[{"name":"Alice","age":30},{"name":"Bob","age":25}]'
      convert={jsonToCsv}
    />
  );
}
