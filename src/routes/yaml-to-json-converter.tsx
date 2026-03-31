import type { Route } from './+types/yaml-to-json-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { yamlToJson } from '@/features/convert/converters';
import { ToolPageContent } from '@/components/ToolPageContent';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'YAML to JSON Converter — Free, No Upload, Private',
    description:
      'Convert YAML to JSON privately in your browser — no data uploaded. Supports multi-document YAML. Free, no account required, 100% client-side.',
    path: '/yaml-to-json-converter',
    faqItems: [
      {
        q: 'Is my data safe to convert here?',
        a: 'Yes. js-yaml runs entirely in your browser. No data is transmitted to any server.',
      },
      {
        q: 'Does it support multi-document YAML?',
        a: 'Yes. Documents separated by --- are converted to a JSON array where each element is one document.',
      },
      {
        q: 'Are YAML-specific types like timestamps handled?',
        a: 'YAML timestamps are converted to ISO 8601 strings in the JSON output. YAML anchors and aliases are resolved before conversion.',
      },
    ],
  });
}

export default function YamlToJsonConverter() {
  return (
    <ConverterLayout
      title="YAML → JSON Converter"
      fromLanguage="yaml"
      toLanguage="json"
      fromPlaceholder={'name: Alice\nroles:\n  - admin\n  - user'}
      convert={yamlToJson}
    >
      <ToolPageContent
        toolName="YAML to JSON converter"
        why={
          <p className="text-fg-secondary">
            YAML config files often contain environment references, internal hostnames, or secrets.
            This converter processes your YAML entirely in your browser using js-yaml — no data is
            uploaded or transmitted.
          </p>
        }
        howItWorks={
          <p className="text-fg-secondary">
            js-yaml parses the YAML input into a JavaScript object, then{' '}
            <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
              JSON.stringify()
            </code>{' '}
            serializes it to formatted JSON. Multi-document YAML (separated by{' '}
            <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
              ---
            </code>
            ) is converted to a JSON array of documents.
          </p>
        }
        useCases={[
          'Converting Kubernetes manifests or Helm values to JSON for programmatic processing',
          'Translating GitHub Actions workflow files to JSON for tooling that requires it',
          'Converting YAML config files to JSON for APIs or services that only accept JSON',
          'Extracting structured data from YAML documentation into JSON',
        ]}
        faq={[
          {
            q: 'Is my data safe to convert here?',
            a: 'Yes. js-yaml runs entirely in your browser. No data is transmitted to any server.',
          },
          {
            q: 'Does it support multi-document YAML?',
            a: 'Yes. Documents separated by --- are converted to a JSON array where each element is one document.',
          },
          {
            q: 'Are YAML-specific types like timestamps handled?',
            a: 'YAML timestamps are converted to ISO 8601 strings in the JSON output. YAML anchors and aliases are resolved before conversion.',
          },
        ]}
      />
    </ConverterLayout>
  );
}
