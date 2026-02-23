import type { Route } from './+types/csv-to-yaml-converter';
import { ConverterLayout } from '@/components/ConverterLayout';
import { csvToYaml } from '@/features/convert/converters';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'CSV to YAML Converter — formatvault' },
    {
      name: 'description',
      content:
        'Convert CSV to YAML online for free. Converts rows to a YAML sequence of mappings. 100% client-side — no data leaves your browser.',
    },
    { property: 'og:title', content: 'CSV to YAML Converter — formatvault' },
    {
      property: 'og:description',
      content: 'Convert CSV to YAML online. No data leaves your browser.',
    },
  ];
}

export default function CsvToYamlConverter() {
  return (
    <ConverterLayout
      title="CSV → YAML Converter"
      fromLanguage="csv"
      toLanguage="yaml"
      fromPlaceholder={'name,age\nAlice,30\nBob,25'}
      convert={csvToYaml}
    />
  );
}
