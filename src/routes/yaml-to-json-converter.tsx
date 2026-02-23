import type { Route } from './+types/yaml-to-json-converter';
import { ConverterLayout } from '@/components/ConverterLayout';
import { yamlToJson } from '@/features/convert/converters';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'YAML to JSON Converter — formatvault' },
    {
      name: 'description',
      content:
        'Convert YAML to JSON online for free. Supports multi-document YAML. Handles all YAML data types. 100% client-side — no data leaves your browser.',
    },
    { property: 'og:title', content: 'YAML to JSON Converter — formatvault' },
    {
      property: 'og:description',
      content:
        'Convert YAML to JSON online. Supports multi-document YAML. No data leaves your browser.',
    },
  ];
}

export default function YamlToJsonConverter() {
  return (
    <ConverterLayout
      title="YAML → JSON Converter"
      fromLanguage="yaml"
      toLanguage="json"
      fromPlaceholder={'name: Alice\nroles:\n  - admin\n  - user'}
      convert={yamlToJson}
    />
  );
}
