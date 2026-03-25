import type { Route } from './+types/toml-to-yaml-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { tomlToYaml } from '@/features/convert/converters';
import { ToolPageContent } from '@/components/ToolPageContent';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'TOML to YAML Converter — Free, No Upload, Private',
    description:
      'Convert TOML to YAML privately in your browser — no data uploaded. Preserves structure and types. Free, no account required, 100% client-side.',
    path: '/toml-to-yaml-converter',
    faqItems: [
      {
        q: 'Is my data safe to convert here?',
        a: 'Yes. All conversion happens in your browser. No data is transmitted to any server.',
      },
    ],
  });
}

export default function TomlToYamlConverter() {
  return (
    <ConverterLayout
      title="TOML → YAML Converter"
      fromLanguage="toml"
      toLanguage="yaml"
      fromPlaceholder={'[server]\nhost = "localhost"\nport = 8080'}
      convert={tomlToYaml}
    >
      <ToolPageContent
        toolName="TOML to YAML converter"
        why={
          <p className="text-fg-secondary">
            Moving between TOML and YAML config formats is common when switching tools or
            ecosystems. This converter handles it entirely in your browser — no data is uploaded or
            transmitted.
          </p>
        }
        howItWorks={
          <p className="text-fg-secondary">
            The converter parses the TOML input into an intermediate object, then serializes that
            object to YAML using js-yaml. TOML tables map to YAML mappings, and TOML arrays of
            tables map to YAML sequences of mappings.
          </p>
        }
        useCases={[
          'Migrating Rust/Python TOML configs to YAML for Ansible or Kubernetes use',
          'Converting Hugo TOML front matter to YAML front matter in Markdown files',
          'Translating TOML config files to YAML for tools that prefer YAML',
        ]}
        faq={[
          {
            q: 'Is my data safe to convert here?',
            a: 'Yes. All conversion happens in your browser. No data is transmitted to any server.',
          },
        ]}
      />
    </ConverterLayout>
  );
}
