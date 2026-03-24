import type { Route } from './+types/json-to-yaml-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { jsonToYaml } from '@/features/convert/converters';
import { ToolPageContent } from '@/components/ToolPageContent';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JSON to YAML Converter — Free, No Upload, Private',
    description:
      'Convert JSON to YAML privately in your browser — no data uploaded. Preserves all structure and types. Free, no account required, 100% client-side.',
    path: '/json-to-yaml-converter',
  });
}

export default function JsonToYamlConverter() {
  return (
    <ConverterLayout
      title="JSON → YAML Converter"
      fromLanguage="json"
      toLanguage="yaml"
      fromPlaceholder='{"name":"Alice","roles":["admin","user"]}'
      convert={jsonToYaml}
    >
      <ToolPageContent
        toolName="JSON to YAML converter"
        why={
          <p className="text-fg-secondary">
            YAML and JSON represent the same data structures — objects, arrays, strings, numbers.
            This converter handles the translation entirely in your browser. No data is uploaded or
            transmitted.
          </p>
        }
        howItWorks={
          <p className="text-fg-secondary">
            The converter parses your JSON with{' '}
            <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-brand-cyan bg-[#00d4e8]/8">
              JSON.parse()
            </code>{' '}
            then serializes the resulting object to YAML using js-yaml. All types — strings,
            numbers, booleans, null, arrays, and nested objects — are preserved correctly.
          </p>
        }
        useCases={[
          'Converting package.json or tsconfig.json to YAML for tools that prefer it',
          'Translating JSON API responses to YAML for use in Kubernetes or Helm values',
          'Converting JSON config files to YAML for Ansible, GitHub Actions, or Docker Compose',
          'Making JSON data more human-readable for documentation or review',
        ]}
        faq={[
          {
            q: 'Is my data safe to convert here?',
            a: 'Yes. All conversion happens in your browser using js-yaml. No data is transmitted to any server.',
          },
          {
            q: 'Are all JSON types preserved?',
            a: 'Yes. Strings, numbers, booleans, null, arrays, and nested objects all convert correctly to their YAML equivalents.',
          },
          {
            q: 'Does it handle JSON with deeply nested structures?',
            a: 'Yes. js-yaml handles arbitrary nesting depth. The output uses YAML block style for readability.',
          },
        ]}
      />
    </ConverterLayout>
  );
}
