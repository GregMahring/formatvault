import type { Route } from './+types/csv-formatter';
import { ToolPlaceholder } from '@/components/ToolPlaceholder';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'CSV Formatter & Validator — formatvault' },
    {
      name: 'description',
      content:
        'Free online CSV formatter and validator. Format, validate and inspect CSV with automatic delimiter detection. 100% client-side.',
    },
  ];
}

export default function CsvFormatter() {
  return (
    <ToolPlaceholder
      title="CSV Formatter"
      description="Format, validate and inspect CSV data"
      inputLabel="CSV Input"
      outputLabel="Formatted Output"
    />
  );
}
