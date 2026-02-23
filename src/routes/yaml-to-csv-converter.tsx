import type { Route } from './+types/yaml-to-csv-converter';
import { ConverterLayout } from '@/components/ConverterLayout';
import { yamlToCsv } from '@/features/convert/converters';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'YAML to CSV Converter — formatvault' },
    {
      name: 'description',
      content:
        'Convert YAML to CSV online for free. YAML must be a sequence of mappings. Warns on nested values. 100% client-side — no data leaves your browser.',
    },
    { property: 'og:title', content: 'YAML to CSV Converter — formatvault' },
    {
      property: 'og:description',
      content: 'Convert YAML sequences to CSV online. No data leaves your browser.',
    },
  ];
}

export default function YamlToCsvConverter() {
  return (
    <ConverterLayout
      title="YAML → CSV Converter"
      fromLanguage="yaml"
      toLanguage="csv"
      fromPlaceholder={'- name: Alice\n  age: 30\n- name: Bob\n  age: 25'}
      convert={yamlToCsv}
    />
  );
}
