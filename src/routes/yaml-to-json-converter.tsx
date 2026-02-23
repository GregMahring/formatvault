import type { Route } from './+types/yaml-to-json-converter';
import { ToolPlaceholder } from '@/components/ToolPlaceholder';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'YAML to JSON Converter — formatvault' },
    {
      name: 'description',
      content:
        'Convert YAML to JSON online for free. Supports multi-document YAML. 100% client-side — no data leaves your browser.',
    },
  ];
}

export default function YamlToJsonConverter() {
  return (
    <ToolPlaceholder
      title="YAML → JSON Converter"
      description="Convert YAML to JSON format"
      inputLabel="YAML Input"
      outputLabel="JSON Output"
    />
  );
}
