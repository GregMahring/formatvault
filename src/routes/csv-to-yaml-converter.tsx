import type { Route } from './+types/csv-to-yaml-converter';
import { ToolPlaceholder } from '@/components/ToolPlaceholder';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'CSV to YAML Converter — formatvault' },
    {
      name: 'description',
      content:
        'Convert CSV to YAML online for free. 100% client-side — no data leaves your browser.',
    },
  ];
}

export default function CsvToYamlConverter() {
  return (
    <ToolPlaceholder
      title="CSV → YAML Converter"
      description="Convert CSV data to YAML format"
      inputLabel="CSV Input"
      outputLabel="YAML Output"
    />
  );
}
