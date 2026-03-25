import type { Route } from './+types/yaml-to-toml-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { yamlToToml } from '@/features/convert/converters';
import { ToolPageContent } from '@/components/ToolPageContent';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'YAML to TOML Converter — Free, No Upload, Private',
    description:
      'Convert YAML to TOML privately in your browser — no data uploaded. YAML root must be a mapping. Free, no account required, 100% client-side.',
    path: '/yaml-to-toml-converter',
    faqItems: [
      {
        q: 'Is my data safe to convert here?',
        a: 'Yes. All conversion happens in your browser. No data is transmitted to any server.',
      },
      {
        q: 'Why must the YAML root be a mapping?',
        a: 'TOML requires a root table (object). A YAML sequence at the root has no direct TOML equivalent.',
      },
    ],
  });
}

export default function YamlToTomlConverter() {
  return (
    <ConverterLayout
      title="YAML → TOML Converter"
      fromLanguage="yaml"
      toLanguage="toml"
      fromPlaceholder={'server:\n  host: localhost\n  port: 8080'}
      convert={yamlToToml}
    >
      <ToolPageContent
        toolName="YAML to TOML converter"
        why={
          <p className="text-fg-secondary">
            Moving YAML configs to TOML for Rust, Python, or Hugo is a common migration task. This
            converter handles it entirely in your browser — no data is uploaded or transmitted.
          </p>
        }
        howItWorks={
          <p className="text-fg-secondary">
            js-yaml parses the YAML input. The root must be a YAML mapping (object) since TOML
            requires a root table. The converter maps YAML sequences of mappings to TOML arrays of
            tables and serializes the result to TOML format.
          </p>
        }
        useCases={[
          'Migrating GitHub Actions or Kubernetes YAML configs to TOML for Rust tooling',
          'Converting YAML front matter in Markdown files to TOML for Hugo',
          'Translating YAML config files to TOML for pyproject.toml or Cargo.toml',
        ]}
        faq={[
          {
            q: 'Is my data safe to convert here?',
            a: 'Yes. All conversion happens in your browser. No data is transmitted to any server.',
          },
          {
            q: 'Why must the YAML root be a mapping?',
            a: 'TOML requires a root table (object). A YAML sequence at the root has no direct TOML equivalent.',
          },
        ]}
      />
    </ConverterLayout>
  );
}
