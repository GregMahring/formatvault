/**
 * Shared meta-tag builder for all routes.
 * Returns a React Router v7 MetaDescriptor array with OG, Twitter Card, and JSON-LD.
 *
 * Usage:
 *   export function meta() { return buildMeta({ title, description, path }); }
 *
 * With FAQPage rich results:
 *   export function meta() { return buildMeta({ title, description, path, faqItems: [...] }); }
 */
import type { MetaDescriptor } from 'react-router';

const SITE_NAME = 'formatvault';
const BASE_URL = 'https://formatvault.dev';
const OG_IMAGE = `${BASE_URL}/og-image.png`;

export interface FaqMetaItem {
  q: string;
  /** Plain text only — no HTML or JSX. Used in JSON-LD. */
  a: string;
}

export interface MetaOptions {
  title: string;
  description: string;
  /** Absolute path, e.g. "/json-formatter" */
  path: string;
  /**
   * JSON-LD structured data type.
   * - SoftwareApplication — default; interactive developer tools
   * - WebPage — generic informational page
   * - AboutPage — the /about page
   * - WebSite — the home page
   */
  schemaType?: 'SoftwareApplication' | 'WebPage' | 'AboutPage' | 'WebSite';
  /**
   * Optional FAQ items for FAQPage rich results.
   * When provided, JSON-LD uses @graph to emit both the page schema and a FAQPage schema.
   * Answers must be plain text (no HTML).
   */
  faqItems?: FaqMetaItem[];
}

// ---------------------------------------------------------------------------
// Internal schema builders
// ---------------------------------------------------------------------------

function toolSchema(
  type: 'SoftwareApplication',
  fullTitle: string,
  description: string,
  url: string
) {
  return {
    '@type': type,
    name: fullTitle,
    description,
    url,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
}

function pageSchema(
  type: 'WebPage' | 'AboutPage',
  fullTitle: string,
  description: string,
  url: string
) {
  return {
    '@type': type,
    name: fullTitle,
    description,
    url,
  };
}

function siteSchema(description: string) {
  return {
    '@type': 'WebSite',
    name: SITE_NAME,
    description,
    url: BASE_URL,
  };
}

function faqSchema(items: FaqMetaItem[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

// ---------------------------------------------------------------------------
// Public builder
// ---------------------------------------------------------------------------

export function buildMeta({
  title,
  description,
  path,
  schemaType = 'SoftwareApplication',
  faqItems,
}: MetaOptions): MetaDescriptor[] {
  const url = `${BASE_URL}${path}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;

  // Build the primary schema node
  let primary: object;
  if (schemaType === 'SoftwareApplication') {
    primary = toolSchema('SoftwareApplication', fullTitle, description, url);
  } else if (schemaType === 'WebSite') {
    primary = siteSchema(description);
  } else {
    primary = pageSchema(schemaType, fullTitle, description, url);
  }

  // Compose JSON-LD: use @graph when FAQs are present so we can attach FAQPage
  let jsonLd: object;
  if (faqItems && faqItems.length > 0) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [primary, faqSchema(faqItems)],
    };
  } else {
    jsonLd = { '@context': 'https://schema.org', ...primary };
  }

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

    // JSON-LD structured data
    { tagName: 'script', type: 'application/ld+json', children: JSON.stringify(jsonLd) },
  ];
}
