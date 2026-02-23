import type { Route } from './+types/base64-encoder';
import { ToolPlaceholder } from '@/components/ToolPlaceholder';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'Base64 Encoder & Decoder — formatvault' },
    {
      name: 'description',
      content:
        'Encode and decode Base64 strings online for free. Unicode-safe. 100% client-side — no data leaves your browser.',
    },
  ];
}

export default function Base64Encoder() {
  return (
    <ToolPlaceholder
      title="Base64 Encoder / Decoder"
      description="Encode and decode Base64 strings (Unicode-safe)"
      inputLabel="Input"
      outputLabel="Output"
    />
  );
}
