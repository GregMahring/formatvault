import type { Route } from './+types/toml-to-json-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { tomlToJson } from '@/features/convert/converters';
import { ToolPageContent } from '@/components/ToolPageContent';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'TOML to JSON Converter — Free, No Upload, Private',
    description:
      'Convert TOML to JSON privately in your browser — no data uploaded. Preserves structure, arrays of tables, and datetime types. Free, no account required, 100% client-side.',
    path: '/toml-to-json-converter',
    faqItems: [
      {
        q: 'How are TOML arrays of tables converted?',
        a: 'TOML arrays of tables (sections defined with [[double brackets]]) become JSON arrays of objects. Each [[table]] entry becomes one element in the array, preserving insertion order.',
      },
      {
        q: 'How are TOML datetime values handled?',
        a: 'TOML has four datetime types: offset datetime, local datetime, local date, and local time. All four are converted to ISO 8601 strings in the JSON output, since JSON has no native datetime type.',
      },
      {
        q: 'Can I convert Cargo.toml or pyproject.toml files?',
        a: 'Yes. Cargo.toml and pyproject.toml are valid TOML files. The converter handles all features used in those files, including dotted keys, inline tables, and multi-line strings.',
      },
      {
        q: 'Is it safe to convert config files that contain secrets or credentials?',
        a: 'Yes. The conversion runs entirely in your browser using a client-side TOML parser — no part of your config file is transmitted to any server. This makes it safe for files that reference database passwords, API keys, or internal hostnames.',
      },
    ],
  });
}

export default function TomlToJsonConverter() {
  return (
    <ConverterLayout
      title="TOML → JSON Converter"
      fromLanguage="toml"
      toLanguage="json"
      fromPlaceholder={'[server]\nhost = "localhost"\nport = 8080'}
      convert={tomlToJson}
    >
      <ToolPageContent
        toolName="TOML to JSON converter"
        why={
          <div className="space-y-3 text-fg-secondary">
            <p>
              TOML is the native config format for Rust (Cargo.toml), Python packaging
              (pyproject.toml), and many other tools. But plenty of downstream tooling — build
              scripts, APIs, linters, and CI systems — only accepts JSON. Converting by hand is
              error-prone because TOML's type system (inline tables, arrays of tables, four datetime
              variants) doesn't map directly to JSON syntax.
            </p>
            <p>
              This converter handles the full TOML v1.0 spec and runs entirely in your browser.
              Config files that contain database credentials, API keys, or internal service
              addresses are never transmitted anywhere.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              The input is parsed using a TOML v1.0-compliant parser that builds an intermediate
              JavaScript object. TOML tables become JSON objects, TOML arrays of tables (
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                [[double brackets]]
              </code>
              ) become JSON arrays, and all four TOML datetime types (offset datetime, local
              datetime, local date, local time) are serialized as ISO 8601 strings since JSON has no
              native datetime type.
            </p>
            <p>
              Dotted keys (
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                a.b.c = 1
              </code>
              ), inline tables, and multi-line basic and literal strings are all handled. The output
              is formatted with 2-space indentation.
            </p>
          </div>
        }
        useCases={[
          'Converting Cargo.toml dependency and workspace sections to JSON for custom tooling',
          'Translating pyproject.toml [tool.*] sections to JSON for CI/CD scripts that parse config',
          'Exporting Hugo or Zola site config (config.toml) to JSON for build pipeline consumption',
          'Converting Taplo-formatted TOML configs to JSON for APIs that only accept JSON payloads',
          'Inspecting TOML structure by converting to JSON and running JSONPath queries',
          'Migrating application config from TOML to a JSON-based config management system',
        ]}
        faq={[
          {
            q: 'How are TOML arrays of tables converted?',
            a: 'TOML arrays of tables (sections defined with [[double brackets]]) become JSON arrays of objects. Each [[table]] entry becomes one element in the array, preserving insertion order.',
          },
          {
            q: 'How are TOML datetime values handled?',
            a: 'TOML has four datetime types: offset datetime, local datetime, local date, and local time. All four are converted to ISO 8601 strings in the JSON output, since JSON has no native datetime type.',
          },
          {
            q: 'Can I convert Cargo.toml or pyproject.toml files?',
            a: 'Yes. Cargo.toml and pyproject.toml are valid TOML files. The converter handles all features used in those files, including dotted keys, inline tables, and multi-line strings.',
          },
          {
            q: 'Is it safe to convert config files that contain secrets or credentials?',
            a: 'Yes. The conversion runs entirely in your browser using a client-side TOML parser — no part of your config file is transmitted to any server. This makes it safe for files that reference database passwords, API keys, or internal hostnames.',
          },
        ]}
      />
    </ConverterLayout>
  );
}
