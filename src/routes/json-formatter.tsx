import type { Route } from './+types/json-formatter';
import { ToolPlaceholder } from '@/components/ToolPlaceholder';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'JSON Formatter & Validator — formatvault' },
    {
      name: 'description',
      content:
        'Free online JSON formatter and validator. Pretty-print, minify, validate and query JSON. 100% client-side — no data leaves your browser.',
    },
  ];
}

export default function JsonFormatter() {
  return (
    <ToolPlaceholder
      title="JSON Formatter"
      description="Pretty-print, minify, validate and query JSON"
      inputLabel="JSON Input"
      outputLabel="Formatted Output"
    />
  );
}
