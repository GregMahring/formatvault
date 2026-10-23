import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  Binary,
  Braces,
  CalendarClock,
  Database,
  FileCode2,
  FileCode,
  FileJson,
  FileText,
  Globe,
  Hash,
  KeyRound,
  Lock,
  Paintbrush,
  Pipette,
  Slash,
  Timer,
} from 'lucide-react';

export type RouteGroup = 'Formatters' | 'Converters' | 'Utilities';

export interface ToolRoute {
  /** Unique identifier — used as command palette id prefix (e.g. 'json-formatter') */
  id: string;
  /** Full display name used in the command palette and page titles */
  label: string;
  /**
   * Shorter label for header nav dropdowns.
   * Falls back to `label` when omitted.
   */
  navLabel?: string;
  /** Route path */
  path: string;
  /** Navigation group */
  group: RouteGroup;
  /** Lucide icon for the command palette entry */
  icon: LucideIcon;
  /** Additional search terms for the command palette fuzzy search */
  keywords?: readonly string[];
}

export const TOOL_ROUTES: readonly ToolRoute[] = [
  // ── Formatters ──────────────────────────────────────────────────────────
  {
    id: 'json-formatter',
    label: 'JSON Formatter',
    path: '/json-formatter',
    group: 'Formatters',
    icon: Braces,
    keywords: ['pretty', 'beautify', 'validate', 'minify'],
  },
  {
    id: 'xml-formatter',
    label: 'XML Formatter',
    path: '/xml-formatter',
    group: 'Formatters',
    icon: FileCode2,
    keywords: ['pretty', 'beautify', 'validate'],
  },
  {
    id: 'csv-formatter',
    label: 'CSV Formatter',
    path: '/csv-formatter',
    group: 'Formatters',
    icon: FileText,
    keywords: ['delimiter', 'comma', 'tab'],
  },
  {
    id: 'yaml-formatter',
    label: 'YAML Formatter',
    path: '/yaml-formatter',
    group: 'Formatters',
    icon: FileCode2,
    keywords: ['yml'],
  },
  {
    id: 'toml-formatter',
    label: 'TOML Formatter',
    path: '/toml-formatter',
    group: 'Formatters',
    icon: FileCode2,
    keywords: ['cargo', 'pyproject', 'config'],
  },
  {
    id: 'sql-formatter',
    label: 'SQL Formatter',
    path: '/sql-formatter',
    group: 'Formatters',
    icon: Database,
    keywords: ['query', 'database', 'select', 'postgres', 'mysql'],
  },
  {
    id: 'javascript-formatter',
    label: 'JavaScript Formatter',
    navLabel: 'JS Formatter',
    path: '/javascript-formatter',
    group: 'Formatters',
    icon: FileCode,
    keywords: ['js', 'beautify', 'prettier', 'pretty', 'jsx', 'typescript', 'ts', 'tsx'],
  },
  {
    id: 'javascript-minifier',
    label: 'JavaScript Minifier',
    navLabel: 'JS Minifier',
    path: '/javascript-minifier',
    group: 'Formatters',
    icon: FileCode,
    keywords: ['js', 'minify', 'compress', 'uglify', 'terser', 'mangle', 'shrink'],
  },
  {
    id: 'css-minifier',
    label: 'CSS Minifier',
    path: '/css-minifier',
    group: 'Formatters',
    icon: Paintbrush,
    keywords: ['css', 'minify', 'compress', 'stylesheet', 'lightningcss', 'shrink', 'styles'],
  },

  // ── Converters ──────────────────────────────────────────────────────────
  {
    id: 'xml-to-json-converter',
    label: 'XML → JSON',
    path: '/xml-to-json-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'xml', 'json'],
  },
  {
    id: 'json-to-xml-converter',
    label: 'JSON → XML',
    path: '/json-to-xml-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'json', 'xml'],
  },
  {
    id: 'json-to-csv-converter',
    label: 'JSON → CSV',
    path: '/json-to-csv-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'json', 'csv'],
  },
  {
    id: 'json-to-yaml-converter',
    label: 'JSON → YAML',
    path: '/json-to-yaml-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'json', 'yaml'],
  },
  {
    id: 'json-to-toml-converter',
    label: 'JSON → TOML',
    path: '/json-to-toml-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'json', 'toml'],
  },
  {
    id: 'json-to-typescript',
    label: 'JSON → TypeScript',
    path: '/json-to-typescript',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'json', 'typescript', 'ts', 'interface', 'types'],
  },
  {
    id: 'csv-to-json-converter',
    label: 'CSV → JSON',
    path: '/csv-to-json-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'csv', 'json'],
  },
  {
    id: 'csv-to-yaml-converter',
    label: 'CSV → YAML',
    path: '/csv-to-yaml-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'csv', 'yaml'],
  },
  {
    id: 'yaml-to-json-converter',
    label: 'YAML → JSON',
    path: '/yaml-to-json-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'yaml', 'json'],
  },
  {
    id: 'yaml-to-toml-converter',
    label: 'YAML → TOML',
    path: '/yaml-to-toml-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'yaml', 'toml'],
  },
  {
    id: 'yaml-to-csv-converter',
    label: 'YAML → CSV',
    path: '/yaml-to-csv-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'yaml', 'csv'],
  },
  {
    id: 'toml-to-json-converter',
    label: 'TOML → JSON',
    path: '/toml-to-json-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'toml', 'json'],
  },
  {
    id: 'toml-to-yaml-converter',
    label: 'TOML → YAML',
    path: '/toml-to-yaml-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'toml', 'yaml'],
  },

  // ── Utilities ────────────────────────────────────────────────────────────
  {
    id: 'regex-tester',
    label: 'Regex Tester',
    path: '/regex-tester',
    group: 'Utilities',
    icon: Slash,
    keywords: ['regexp', 'pattern', 'match', 'test'],
  },
  {
    id: 'jwt-decoder',
    label: 'JWT Decoder',
    path: '/jwt-decoder',
    group: 'Utilities',
    icon: KeyRound,
    keywords: ['token', 'decode'],
  },
  {
    id: 'base64-encoder',
    label: 'Base64 Encoder',
    path: '/base64-encoder',
    group: 'Utilities',
    icon: Lock,
    keywords: ['encode', 'decode', 'base64'],
  },
  {
    id: 'url-encoder',
    label: 'URL Encoder',
    path: '/url-encoder',
    group: 'Utilities',
    icon: Globe,
    keywords: ['percent', 'encode', 'decode', 'query'],
  },
  {
    id: 'unix-timestamp-converter',
    label: 'Unix Timestamp Converter',
    navLabel: 'Timestamp Converter',
    path: '/unix-timestamp-converter',
    group: 'Utilities',
    icon: Timer,
    keywords: ['timestamp', 'unix', 'epoch', 'date', 'time', 'seconds', 'milliseconds'],
  },
  {
    id: 'cron-expression-explainer',
    label: 'Cron Expression Explainer',
    navLabel: 'Cron Explainer',
    path: '/cron-expression-explainer',
    group: 'Utilities',
    icon: CalendarClock,
    keywords: ['cron', 'schedule', 'recurring', 'job', 'task', 'cronjob', 'next run'],
  },
  {
    id: 'color-picker',
    label: 'Color Picker',
    path: '/color-picker',
    group: 'Utilities',
    icon: Pipette,
    keywords: ['color', 'colour', 'hex', 'rgb', 'hsl', 'oklch', 'picker', 'converter'],
  },
  {
    id: 'number-base-converter',
    label: 'Number Base Converter',
    path: '/number-base-converter',
    group: 'Utilities',
    icon: Binary,
    keywords: ['binary', 'hex', 'octal', 'decimal', 'base', 'bits', 'number', 'convert'],
  },
  {
    id: 'hash-generator',
    label: 'Hash Generator',
    path: '/hash-generator',
    group: 'Utilities',
    icon: Hash,
    keywords: ['md5', 'sha', 'sha256', 'sha512', 'checksum', 'digest'],
  },
  {
    id: 'json-schema-generator',
    label: 'JSON Schema Generator',
    path: '/json-schema-generator',
    group: 'Utilities',
    icon: FileJson,
    keywords: ['schema', 'json', 'generate', 'validate', 'draft'],
  },
] as const;

/** Routes belonging to a specific group, in declaration order. */
export function getRoutesByGroup(group: RouteGroup): readonly ToolRoute[] {
  return TOOL_ROUTES.filter((r) => r.group === group);
}

const GROUP_ORDER: readonly RouteGroup[] = ['Formatters', 'Converters', 'Utilities'];

/**
 * Navigation groups consumed by `Header`.
 * Each item's `label` uses `navLabel` when present (shorter strings for dropdowns).
 */
export const NAV_GROUPS = GROUP_ORDER.map((group) => ({
  label: group,
  items: getRoutesByGroup(group).map((r) => ({
    to: r.path,
    label: r.navLabel ?? r.label,
  })),
}));

/**
 * Hand-picked "Related tools" for each tool page, keyed by route id.
 * The server-rendered header nav is a closed dropdown, so these links are the
 * main crawlable path between tool pages — every tool needs an entry.
 */
export const RELATED_TOOL_IDS: Readonly<Record<string, readonly string[]>> = {
  'json-formatter': [
    'json-schema-generator',
    'json-to-typescript',
    'json-to-csv-converter',
    'json-to-yaml-converter',
    'jwt-decoder',
  ],
  'xml-formatter': [
    'xml-to-json-converter',
    'json-to-xml-converter',
    'json-formatter',
    'yaml-formatter',
  ],
  'csv-formatter': [
    'csv-to-json-converter',
    'csv-to-yaml-converter',
    'json-to-csv-converter',
    'json-formatter',
  ],
  'yaml-formatter': [
    'yaml-to-json-converter',
    'yaml-to-toml-converter',
    'json-to-yaml-converter',
    'toml-formatter',
    'json-formatter',
  ],
  'toml-formatter': [
    'toml-to-json-converter',
    'toml-to-yaml-converter',
    'json-to-toml-converter',
    'yaml-formatter',
  ],
  'sql-formatter': ['json-formatter', 'csv-formatter', 'regex-tester', 'javascript-formatter'],
  'javascript-formatter': ['javascript-minifier', 'css-minifier', 'json-formatter', 'regex-tester'],
  'javascript-minifier': [
    'javascript-formatter',
    'css-minifier',
    'hash-generator',
    'base64-encoder',
  ],
  'css-minifier': ['javascript-minifier', 'javascript-formatter', 'color-picker'],

  'xml-to-json-converter': [
    'json-to-xml-converter',
    'xml-formatter',
    'json-formatter',
    'yaml-to-json-converter',
  ],
  'json-to-xml-converter': [
    'xml-to-json-converter',
    'xml-formatter',
    'json-formatter',
    'json-to-yaml-converter',
  ],
  'json-to-csv-converter': [
    'csv-to-json-converter',
    'csv-formatter',
    'json-formatter',
    'yaml-to-csv-converter',
  ],
  'json-to-yaml-converter': [
    'yaml-to-json-converter',
    'yaml-formatter',
    'json-formatter',
    'json-to-toml-converter',
  ],
  'json-to-toml-converter': [
    'toml-to-json-converter',
    'toml-formatter',
    'json-formatter',
    'json-to-yaml-converter',
  ],
  'json-to-typescript': ['json-schema-generator', 'json-formatter', 'json-to-yaml-converter'],
  'csv-to-json-converter': [
    'json-to-csv-converter',
    'csv-formatter',
    'json-formatter',
    'csv-to-yaml-converter',
  ],
  'csv-to-yaml-converter': [
    'yaml-to-csv-converter',
    'csv-formatter',
    'yaml-formatter',
    'csv-to-json-converter',
  ],
  'yaml-to-json-converter': [
    'json-to-yaml-converter',
    'yaml-formatter',
    'json-formatter',
    'yaml-to-toml-converter',
  ],
  'yaml-to-toml-converter': [
    'toml-to-yaml-converter',
    'yaml-formatter',
    'toml-formatter',
    'yaml-to-json-converter',
  ],
  'yaml-to-csv-converter': [
    'csv-to-yaml-converter',
    'yaml-formatter',
    'csv-formatter',
    'yaml-to-json-converter',
  ],
  'toml-to-json-converter': [
    'json-to-toml-converter',
    'toml-formatter',
    'json-formatter',
    'toml-to-yaml-converter',
  ],
  'toml-to-yaml-converter': [
    'yaml-to-toml-converter',
    'toml-formatter',
    'yaml-formatter',
    'toml-to-json-converter',
  ],

  'regex-tester': [
    'url-encoder',
    'javascript-formatter',
    'json-formatter',
    'cron-expression-explainer',
  ],
  'jwt-decoder': ['base64-encoder', 'json-formatter', 'unix-timestamp-converter', 'hash-generator'],
  'base64-encoder': ['url-encoder', 'jwt-decoder', 'hash-generator', 'number-base-converter'],
  'url-encoder': ['base64-encoder', 'jwt-decoder', 'regex-tester', 'json-formatter'],
  'unix-timestamp-converter': ['cron-expression-explainer', 'jwt-decoder', 'number-base-converter'],
  'cron-expression-explainer': ['unix-timestamp-converter', 'regex-tester', 'yaml-formatter'],
  'color-picker': ['css-minifier', 'number-base-converter', 'base64-encoder'],
  'number-base-converter': [
    'color-picker',
    'hash-generator',
    'base64-encoder',
    'unix-timestamp-converter',
  ],
  'hash-generator': ['base64-encoder', 'jwt-decoder', 'number-base-converter', 'url-encoder'],
  'json-schema-generator': [
    'json-formatter',
    'json-to-typescript',
    'yaml-to-json-converter',
    'json-to-yaml-converter',
  ],
};

/** Related tools for the page at `pathname`, or an empty list for non-tool pages. */
export function getRelatedRoutes(pathname: string): readonly ToolRoute[] {
  // The router matches paths case-insensitively and with a trailing slash.
  const id = pathname.replace(/^\/|\/$/g, '').toLowerCase();
  const relatedIds = RELATED_TOOL_IDS[id] ?? [];
  return relatedIds.flatMap((relatedId) => TOOL_ROUTES.find((r) => r.id === relatedId) ?? []);
}
