/**
 * Shared meta-tag builder for all routes.
 * Returns a React Router v7 MetaDescriptor array with OG, Twitter Card, and JSON-LD.
 *
 * Usage:
 *   export function meta() { return buildMeta({ title, description, path }); }
 */
import type { MetaDescriptor } from 'react-router';

const SITE_NAME = 'formatvault';
const BASE_URL = 'https://formatvault.dev';
const OG_IMAGE = `${BASE_URL}/og-image.png`;

export interface MetaOptions {
  title: string;
  description: string;
  /** Absolute path, e.g. "/json-formatter" */
  path: string;
  /**
   * JSON-LD structured data type.
   * Defaults to 'WebApplication' (used for interactive tools).
   */
  schemaType?: 'WebApplication' | 'WebPage';
}

export function buildMeta({
  title,
  description,
  path,
  schemaType = 'WebApplication',
}: MetaOptions): MetaDescriptor[] {
  const url = `${BASE_URL}${path}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: fullTitle,
    description,
    url,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  });

  return [
    { title: fullTitle },
    { name: 'description', content: description },

    // Canonical URL
    { tagName: 'link', rel: 'canonical', href: url },

    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: OG_IMAGE },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },

    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: OG_IMAGE },

    // JSON-LD structured data (React Router v7 catch-all descriptor shape)
    { tagName: 'script', type: 'application/ld+json', children: jsonLd },
  ];
}
