import type { Route } from './+types/yaml-to-toml-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { yamlToToml } from '@/features/convert/converters';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'YAML to TOML Converter',
    description:
      'Convert YAML to TOML online for free. YAML root must be a mapping. 100% client-side.',
    path: '/yaml-to-toml-converter',
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
    />
  );
}
