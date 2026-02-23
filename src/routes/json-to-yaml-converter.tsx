import type { Route } from './+types/json-to-yaml-converter';
import { ConverterLayout } from '@/components/ConverterLayout';
import { jsonToYaml } from '@/features/convert/converters';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'JSON to YAML Converter — formatvault' },
    {
      name: 'description',
      content:
        'Convert JSON to YAML online for free. Instant, lossless conversion preserving all data types. 100% client-side — no data leaves your browser.',
    },
    { property: 'og:title', content: 'JSON to YAML Converter — formatvault' },
    {
      property: 'og:description',
      content: 'Convert JSON to YAML online. Instant and lossless. No data leaves your browser.',
    },
  ];
}

export default function JsonToYamlConverter() {
  return (
    <ConverterLayout
      title="JSON → YAML Converter"
      fromLanguage="json"
      toLanguage="yaml"
      fromPlaceholder='{"name":"Alice","roles":["admin","user"]}'
      convert={jsonToYaml}
    />
  );
}
