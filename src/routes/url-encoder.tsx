import type { Route } from './+types/url-encoder';
import { ToolPlaceholder } from '@/components/ToolPlaceholder';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'URL Encoder & Decoder — formatvault' },
    {
      name: 'description',
      content:
        'URL-encode and decode strings online for free. Uses encodeURIComponent for accurate percent-encoding. 100% client-side.',
    },
  ];
}

export default function UrlEncoder() {
  return (
    <ToolPlaceholder
      title="URL Encoder / Decoder"
      description="URL-encode and decode strings"
      inputLabel="Input"
      outputLabel="Output"
    />
  );
}
