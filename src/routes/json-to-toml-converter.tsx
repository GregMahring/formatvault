import type { Route } from './+types/json-to-toml-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { jsonToToml } from '@/features/convert/converters';
import { ToolPageContent } from '@/components/ToolPageContent';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JSON to TOML Converter — Free, No Upload, Private',
    description:
      'Convert JSON to TOML privately in your browser — no data uploaded. JSON root must be an object. Free, no account required, 100% client-side.',
    path: '/json-to-toml-converter',
    faqItems: [
      {
        q: 'Is my data safe to convert here?',
        a: 'Yes. All conversion happens in your browser. No data is transmitted to any server.',
      },
      {
        q: 'Why must the JSON root be an object?',
        a: 'TOML requires a root table (object). JSON arrays at the root level have no direct TOML equivalent, so the input must be a JSON object.',
      },
    ],
  });
}

export default function JsonToTomlConverter() {
  return (
    <ConverterLayout
      title="JSON → TOML Converter"
      fromLanguage="json"
      toLanguage="toml"
      fromPlaceholder={'{"server":{"host":"localhost","port":8080}}'}
      convert={jsonToToml}
    >
      <ToolPageContent
        toolName="JSON to TOML converter"
        why={
          <p className="text-fg-secondary">
            TOML is the preferred config format for Rust (Cargo.toml), Python (pyproject.toml), and
            Hugo. This converter translates JSON to TOML entirely in your browser — no data is
            uploaded or transmitted.
          </p>
        }
        howItWorks={
          <p className="text-fg-secondary">
            The converter parses the JSON input and maps each type to its TOML equivalent. The JSON
            root must be an object (not an array) since TOML requires a root table. Nested objects
            become TOML tables, and arrays of objects become TOML arrays of tables.
          </p>
        }
        useCases={[
          'Converting package.json configuration sections to Cargo.toml format',
          'Translating JSON config files to TOML for Hugo or other TOML-based tools',
          'Converting JSON API responses to TOML for config file generation',
        ]}
        faq={[
          {
            q: 'Is my data safe to convert here?',
            a: 'Yes. All conversion happens in your browser. No data is transmitted to any server.',
          },
          {
            q: 'Why must the JSON root be an object?',
            a: 'TOML requires a root table (object). JSON arrays at the root level have no direct TOML equivalent, so the input must be a JSON object.',
          },
        ]}
      />
    </ConverterLayout>
  );
}
