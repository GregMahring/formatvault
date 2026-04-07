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
          <div className="space-y-3 text-fg-secondary">
            <p>
              YAML is the standard config format for Kubernetes, Ansible, GitHub Actions, and most
              modern CI/CD systems. But programmatic tooling — scripts, APIs, data pipelines —
              almost universally expects JSON. Kubernetes manifests and Helm values files often
              contain internal service addresses, secret references, and environment-specific
              configuration that shouldn't be pasted into an online converter.
            </p>
            <p>
              This converter uses js-yaml, the same parser that many Node.js tools use internally,
              running entirely in your browser. Nothing you paste is transmitted anywhere.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              js-yaml parses the YAML input into a JavaScript object tree, resolving all anchors (
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                &anchor
              </code>
              ) and aliases (
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                *alias
              </code>
              ) before conversion.{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                JSON.stringify()
              </code>{' '}
              then serializes the result with 2-space indentation.
            </p>
            <p>
              Multi-document YAML files (documents separated by{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                ---
              </code>
              ) are converted to a JSON array where each element is one parsed document. YAML
              timestamps are converted to ISO 8601 strings. YAML booleans (
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                yes
              </code>
              ,{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                no
              </code>
              ,{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                on
              </code>
              ,{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                off
              </code>
              ) are resolved to JSON{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                true
              </code>{' '}
              and{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                false
              </code>
              .
            </p>
          </div>
        }
        useCases={[
          'Converting Kubernetes manifests or Helm values files to JSON for programmatic processing',
          'Translating GitHub Actions workflow YAML to JSON for tooling that requires JSON input',
          'Exporting Ansible playbooks or inventory YAML to JSON for reporting scripts',
          'Converting Docker Compose files to JSON for validation or transformation pipelines',
          'Extracting structured data from YAML-formatted API documentation into JSON',
          'Consuming multi-document YAML pipelines as a JSON array for further processing',
          'Debugging YAML anchor/alias expansion by seeing the fully resolved JSON output',
        ]}
        faq={[
          {
            q: 'Does it support multi-document YAML?',
            a: 'Yes. Documents separated by --- are converted to a JSON array where each element is one parsed document. This is useful for Kubernetes manifests that bundle multiple resources in a single file.',
          },
          {
            q: 'How are YAML anchors and aliases handled?',
            a: 'Anchors (&name) and aliases (*name) are fully resolved before conversion. The output JSON reflects the dereferenced values — aliases are replaced with the full content of their anchor, which is useful for seeing the actual data that YAML aliases abstract away.',
          },
          {
            q: 'Are YAML-specific boolean values like yes/no converted correctly?',
            a: 'Yes. YAML 1.1 boolean variants (yes, no, on, off, true, false) are all resolved to JSON true or false. This is particularly relevant for Kubernetes and Ansible YAML which uses these variants.',
          },
          {
            q: 'How are YAML timestamps converted?',
            a: 'YAML timestamps are parsed by js-yaml and converted to ISO 8601 strings in the JSON output. JSON has no native datetime type, so string is the closest equivalent and the most interoperable format.',
          },
          {
            q: 'Is it safe to convert Kubernetes secrets or Helm values with credentials?',
            a: 'Yes. js-yaml runs entirely in your browser — your manifests and values files are never transmitted to any server. This is specifically designed for infrastructure files that contain sensitive references.',
          },
        ]}
      />
    </ConverterLayout>
  );
}
