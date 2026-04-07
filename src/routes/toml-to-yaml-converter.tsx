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
      'Convert TOML to YAML privately in your browser — no data uploaded. Handles arrays of tables, dotted keys, and all TOML datetime types. Free, no account required, 100% client-side.',
    path: '/toml-to-yaml-converter',
    faqItems: [
      {
        q: 'How are TOML arrays of tables represented in YAML?',
        a: 'TOML arrays of tables ([[double bracket]] sections) become YAML sequences of mappings. Each [[entry]] maps to one item in the YAML sequence, preserving the original order.',
      },
      {
        q: 'Does the converter handle TOML datetime types?',
        a: 'Yes. All four TOML datetime types (offset datetime, local datetime, local date, local time) are output as ISO 8601 strings in the YAML. YAML has a timestamp type but js-yaml outputs these as quoted strings to avoid ambiguity.',
      },
      {
        q: 'Can I convert Hugo TOML front matter to YAML?',
        a: 'Yes. Hugo supports both TOML (+++ delimited) and YAML (--- delimited) front matter. Paste the TOML content (without the +++ delimiters) into the converter to get equivalent YAML that you can use with --- delimiters.',
      },
      {
        q: 'Is it safe to convert config files with secrets here?',
        a: 'Yes. Both the TOML parser and the YAML serializer run entirely in your browser. No data is sent to any server, making it safe for config files containing environment variable values, database credentials, or internal service URLs.',
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
          <div className="space-y-3 text-fg-secondary">
            <p>
              TOML and YAML serve the same purpose — human-editable config files — but different
              ecosystems have settled on different defaults. Rust and Python tooling favours TOML;
              Kubernetes, Ansible, and most CI systems use YAML. Moving between them by hand is
              tedious and error-prone, especially for files with nested tables, arrays of tables,
              and datetime values.
            </p>
            <p>
              This converter parses TOML and re-serializes to YAML entirely in your browser using
              js-yaml. Config files containing passwords, tokens, or internal service addresses are
              never sent anywhere.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              The TOML input is parsed into a JavaScript object using a TOML v1.0-compliant parser.
              That object is then serialized to YAML using js-yaml's{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                dump
              </code>{' '}
              function with block style. TOML tables become YAML mappings, and TOML arrays of tables
              (
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                [[double brackets]]
              </code>
              ) become YAML sequences of mappings.
            </p>
            <p>
              TOML's four datetime types are all output as ISO 8601 strings. TOML dotted keys and
              inline tables are normalized into nested YAML mappings. Multi-line strings are
              preserved using YAML's literal block scalar style where possible.
            </p>
          </div>
        }
        useCases={[
          'Converting Cargo.toml workspace config to YAML for Ansible inventory or playbooks',
          'Translating pyproject.toml [tool.*] sections to YAML for tools that read YAML config',
          'Converting Hugo or Zola TOML front matter to YAML front matter in Markdown files',
          'Migrating application config from TOML to YAML-based config management (e.g. Helm values)',
          'Translating Taplo-formatted TOML to YAML for Kubernetes ConfigMap entries',
          'Converting TOML CI config to YAML for GitHub Actions or GitLab CI',
        ]}
        faq={[
          {
            q: 'How are TOML arrays of tables represented in YAML?',
            a: 'TOML arrays of tables ([[double bracket]] sections) become YAML sequences of mappings. Each [[entry]] maps to one item in the YAML sequence, preserving the original order.',
          },
          {
            q: 'Does the converter handle TOML datetime types?',
            a: 'Yes. All four TOML datetime types (offset datetime, local datetime, local date, local time) are output as ISO 8601 strings in the YAML. YAML has a timestamp type but js-yaml outputs these as quoted strings to avoid ambiguity.',
          },
          {
            q: 'Can I convert Hugo TOML front matter to YAML?',
            a: 'Yes. Hugo supports both TOML (+++ delimited) and YAML (--- delimited) front matter. Paste the TOML content (without the +++ delimiters) into the converter to get equivalent YAML that you can use with --- delimiters.',
          },
          {
            q: 'Is it safe to convert config files with secrets here?',
            a: 'Yes. Both the TOML parser and the YAML serializer run entirely in your browser. No data is sent to any server, making it safe for config files containing environment variable values, database credentials, or internal service URLs.',
          },
        ]}
      />
    </ConverterLayout>
  );
}
