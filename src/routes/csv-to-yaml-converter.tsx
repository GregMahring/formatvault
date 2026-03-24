import type { Route } from './+types/csv-to-yaml-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { csvToYaml } from '@/features/convert/converters';
import { ToolPageContent } from '@/components/ToolPageContent';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'CSV to YAML Converter — Free, No Upload, Private',
    description:
      'Convert CSV to YAML privately in your browser — no data uploaded. Auto-detects delimiter and maps rows to objects. Free, no account required, 100% client-side.',
    path: '/csv-to-yaml-converter',
  });
}

export default function CsvToYamlConverter() {
  return (
    <ConverterLayout
      title="CSV → YAML Converter"
      fromLanguage="csv"
      toLanguage="yaml"
      fromPlaceholder={'name,age\nAlice,30\nBob,25'}
      convert={csvToYaml}
    >
      <ToolPageContent
        toolName="CSV to YAML converter"
        why={
          <p className="text-fg-secondary">
            Converting CSV to YAML for config files or Kubernetes data is a common task. This
            converter handles it entirely in your browser using PapaParse and js-yaml — no data is
            uploaded or transmitted.
          </p>
        }
        howItWorks={
          <p className="text-fg-secondary">
            PapaParse parses the CSV (auto-detecting the delimiter), maps each row to an object
            using the header row as keys, then js-yaml serializes the resulting array to YAML block
            style. Each CSV row becomes a YAML mapping entry.
          </p>
        }
        useCases={[
          'Converting spreadsheet data to YAML for use in Ansible playbooks or Helm values',
          'Transforming CSV config data to YAML for GitHub Actions or Docker Compose',
          'Converting lookup tables from CSV to YAML for application config files',
        ]}
        faq={[
          {
            q: 'Is my data safe to convert here?',
            a: 'Yes. All conversion happens in your browser. No data is transmitted to any server.',
          },
          {
            q: 'What input format is expected?',
            a: 'A CSV with a header row is expected. Each row becomes a YAML mapping where the header values are the keys.',
          },
        ]}
      />
    </ConverterLayout>
  );
}
