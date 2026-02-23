import type { Route } from './+types/yaml-formatter';
import { ToolPlaceholder } from '@/components/ToolPlaceholder';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'YAML Formatter & Validator — formatvault' },
    {
      name: 'description',
      content:
        'Free online YAML formatter and validator. Format and validate YAML with line-level error reporting. 100% client-side.',
    },
  ];
}

export default function YamlFormatter() {
  return (
    <ToolPlaceholder
      title="YAML Formatter"
      description="Format and validate YAML"
      inputLabel="YAML Input"
      outputLabel="Formatted Output"
    />
  );
}
