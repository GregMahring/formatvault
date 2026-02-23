import type { Route } from './+types/yaml-to-csv-converter';
import { ToolPlaceholder } from '@/components/ToolPlaceholder';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'YAML to CSV Converter — formatvault' },
    {
      name: 'description',
      content:
        'Convert YAML to CSV online for free. 100% client-side — no data leaves your browser.',
    },
  ];
}

export default function YamlToCsvConverter() {
  return (
    <ToolPlaceholder
      title="YAML → CSV Converter"
      description="Convert YAML to CSV format"
      inputLabel="YAML Input"
      outputLabel="CSV Output"
    />
  );
}
