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
      'Convert TOML to JSON privately in your browser — no data uploaded. Preserves structure and types. Free, no account required, 100% client-side.',
    path: '/toml-to-json-converter',
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
          <p className="text-fg-secondary">
            TOML config files like Cargo.toml or pyproject.toml sometimes need to be converted to
            JSON for tooling that only accepts JSON. This converter runs entirely in your browser —
            no data is uploaded or transmitted.
          </p>
        }
        howItWorks={
          <p className="text-fg-secondary">
            The converter parses the TOML input using a TOML parser library, maps all types to their
            JSON equivalents, and outputs formatted JSON. TOML tables become JSON objects, TOML
            arrays of tables become JSON arrays, and TOML date-times are represented as ISO 8601
            strings.
          </p>
        }
        useCases={[
          'Converting Cargo.toml dependency sections to JSON for tooling',
          'Translating pyproject.toml config to JSON for CI/CD scripts',
          'Converting TOML-based config files to JSON for APIs',
        ]}
        faq={[
          {
            q: 'Is my data safe to convert here?',
            a: 'Yes. All conversion happens in your browser. No data is transmitted to any server.',
          },
          {
            q: 'How are TOML dates handled?',
            a: 'TOML datetime values are converted to ISO 8601 strings in the JSON output.',
          },
        ]}
      />
    </ConverterLayout>
  );
}
