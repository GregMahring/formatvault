import type { Route } from './+types/json-to-csv-converter';
import { ToolPlaceholder } from '@/components/ToolPlaceholder';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'JSON to CSV Converter — formatvault' },
    {
      name: 'description',
      content:
        'Convert JSON to CSV online for free. Handles nested objects and arrays. 100% client-side — no data leaves your browser.',
    },
  ];
}

export default function JsonToCsvConverter() {
  return (
    <ToolPlaceholder
      title="JSON → CSV Converter"
      description="Convert JSON arrays to CSV format"
      inputLabel="JSON Input"
      outputLabel="CSV Output"
    />
  );
}
