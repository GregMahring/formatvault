import type { Route } from './+types/toml-to-yaml-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { tomlToYaml } from '@/features/convert/converters';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'TOML to YAML Converter',
    description:
      'Convert TOML to YAML online for free. Preserves structure and types. 100% client-side.',
    path: '/toml-to-yaml-converter',
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
    />
  );
}
