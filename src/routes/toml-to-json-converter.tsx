import type { Route } from './+types/toml-to-json-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { tomlToJson } from '@/features/convert/converters';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'TOML to JSON Converter',
    description:
      'Convert TOML to JSON online for free. Preserves structure and types. 100% client-side.',
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
    />
  );
}
