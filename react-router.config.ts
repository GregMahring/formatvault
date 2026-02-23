import type { Config } from '@react-router/dev/config';

export default {
  // Use src/ as the app directory (matches our project structure)
  appDirectory: 'src',

  // Enable SSR for meta tag injection per route (SEO/GEO — see ADR-0003)
  ssr: true,
} satisfies Config;
