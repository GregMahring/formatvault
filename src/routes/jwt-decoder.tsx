import type { Route } from './+types/jwt-decoder';
import { ToolPlaceholder } from '@/components/ToolPlaceholder';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'JWT Decoder — Decode JSON Web Tokens Online — formatvault' },
    {
      name: 'description',
      content:
        'Decode and inspect JWT tokens online for free. View header, payload and expiry. No verification — 100% client-side, token never sent to a server.',
    },
  ];
}

export default function JwtDecoder() {
  return (
    <ToolPlaceholder
      title="JWT Decoder"
      description="Decode JWT header, payload and expiry"
      inputLabel="JWT Token"
      outputLabel="Decoded Output"
    />
  );
}
