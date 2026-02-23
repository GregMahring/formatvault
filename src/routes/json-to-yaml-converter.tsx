import type { Route } from './+types/json-to-yaml-converter';
import { ToolPlaceholder } from '@/components/ToolPlaceholder';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'JSON to YAML Converter — formatvault' },
    {
      name: 'description',
      content:
        'Convert JSON to YAML online for free. Instant, accurate conversion. 100% client-side — no data leaves your browser.',
    },
  ];
}

export default function JsonToYamlConverter() {
  return (
    <ToolPlaceholder
      title="JSON → YAML Converter"
      description="Convert JSON to YAML format"
      inputLabel="JSON Input"
      outputLabel="YAML Output"
    />
  );
}
